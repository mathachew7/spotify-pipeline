"""
Spotify Listening History Ingestion DAG
Daily: fetch recently played + audio features → GCS raw JSON → BigQuery

Schedule: 06:00 UTC daily
Retries: 3 with exponential backoff (1min, 2min, 4min)
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any

import requests
from airflow import DAG
from airflow.models import Variable
from airflow.operators.python import PythonOperator
from airflow.providers.google.cloud.hooks.gcs import GCSHook
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import (
    GCSToBigQueryOperator,
)
from airflow.utils.dates import days_ago
from tenacity import retry, stop_after_attempt, wait_exponential

log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────

SPOTIFY_CLIENT_ID = os.environ["SPOTIFY_CLIENT_ID"]
SPOTIFY_CLIENT_SECRET = os.environ["SPOTIFY_CLIENT_SECRET"]
SPOTIFY_REFRESH_TOKEN = os.environ["SPOTIFY_REFRESH_TOKEN"]
GCS_BUCKET = os.environ["GCS_BUCKET"]
GCP_PROJECT = os.environ["GCP_PROJECT_ID"]
BQ_DATASET = os.environ.get("BQ_DATASET", "spotify_warehouse")

DEFAULT_ARGS: dict[str, Any] = {
    "owner": "wavelength",
    "retries": 3,
    "retry_delay": timedelta(minutes=1),
    "retry_exponential_backoff": True,
    "max_retry_delay": timedelta(minutes=8),
    "email_on_failure": False,
    "depends_on_past": False,
}

# ── Spotify Auth ──────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def get_access_token() -> str:
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        data={
            "grant_type": "refresh_token",
            "refresh_token": SPOTIFY_REFRESH_TOKEN,
        },
        auth=(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


# ── Spotify API helpers ───────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def spotify_get(url: str, headers: dict, params: dict | None = None) -> dict:
    resp = requests.get(url, headers=headers, params=params, timeout=20)
    if resp.status_code == 429:
        retry_after = int(resp.headers.get("Retry-After", 5))
        log.warning("Rate limited. Sleeping %ss", retry_after)
        time.sleep(retry_after)
        resp.raise_for_status()
    resp.raise_for_status()
    return resp.json()


def fetch_recently_played(access_token: str) -> list[dict]:
    """Cursor-paginate through recently played, up to 200 items."""
    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.spotify.com/v1/me/player/recently-played"
    items: list[dict] = []
    params: dict = {"limit": 50}
    cursor: str | None = None

    for _ in range(4):  # max 4 pages = 200 items
        if cursor:
            params["before"] = cursor
        data = spotify_get(url, headers, params)
        batch = data.get("items", [])
        items.extend(batch)
        cursors = data.get("cursors") or {}
        cursor = cursors.get("before")
        if not cursor or not data.get("next"):
            break

    log.info("Fetched %d recently played items", len(items))
    return items


def fetch_audio_features(track_ids: list[str], access_token: str) -> list[dict]:
    """Batch-fetch audio features (100 per request)."""
    headers = {"Authorization": f"Bearer {access_token}"}
    features: list[dict] = []
    for i in range(0, len(track_ids), 100):
        batch = track_ids[i : i + 100]
        data = spotify_get(
            "https://api.spotify.com/v1/audio-features",
            headers,
            {"ids": ",".join(batch)},
        )
        features.extend([f for f in data.get("audio_features", []) if f])
    log.info("Fetched audio features for %d tracks", len(features))
    return features


# ── Task functions ────────────────────────────────────────────────────────

def ingest_spotify(**context: Any) -> dict:
    """Fetch play history + audio features, upload to GCS."""
    run_date: str = context["ds"]  # YYYY-MM-DD
    access_token = get_access_token()

    plays = fetch_recently_played(access_token)
    if not plays:
        log.warning("No plays found for %s", run_date)
        return {"gcs_paths": [], "track_count": 0}

    track_ids = list({item["track"]["id"] for item in plays})
    audio_features = fetch_audio_features(track_ids, access_token)
    features_by_id = {f["id"]: f for f in audio_features}

    payload = {
        "run_date": run_date,
        "plays": plays,
        "audio_features": audio_features,
        "features_by_track_id": features_by_id,
        "_ingested_at": datetime.utcnow().isoformat(),
    }

    gcs_path = f"raw/spotify/{run_date}/plays_{run_date}.json"
    hook = GCSHook()
    hook.upload(
        bucket_name=GCS_BUCKET,
        object_name=gcs_path,
        data=json.dumps(payload, default=str),
        mime_type="application/json",
    )
    log.info("Uploaded to gs://%s/%s", GCS_BUCKET, gcs_path)

    # Push paths for downstream tasks
    context["ti"].xcom_push(key="gcs_path", value=gcs_path)
    context["ti"].xcom_push(key="track_count", value=len(track_ids))

    return {"gcs_path": gcs_path, "track_count": len(track_ids)}


def validate_upload(**context: Any) -> None:
    """Check the uploaded GCS object is non-empty and valid JSON."""
    gcs_path: str = context["ti"].xcom_pull(key="gcs_path")
    if not gcs_path:
        raise ValueError("No gcs_path in XCom — ingest task may have failed")

    hook = GCSHook()
    blob = hook.download(bucket_name=GCS_BUCKET, object_name=gcs_path)
    try:
        data = json.loads(blob)
        play_count = len(data.get("plays", []))
        log.info("Validated %s — %d plays", gcs_path, play_count)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON at gs://{GCS_BUCKET}/{gcs_path}: {e}") from e


# ── DAG definition ────────────────────────────────────────────────────────

with DAG(
    dag_id="spotify_ingestion",
    default_args=DEFAULT_ARGS,
    description="Daily Spotify listening history → GCS → BigQuery",
    schedule_interval="0 6 * * *",
    start_date=days_ago(1),
    catchup=False,
    max_active_runs=1,
    tags=["spotify", "wavelength"],
) as dag:

    ingest = PythonOperator(
        task_id="ingest_spotify",
        python_callable=ingest_spotify,
    )

    validate = PythonOperator(
        task_id="validate_upload",
        python_callable=validate_upload,
    )

    load_plays = GCSToBigQueryOperator(
        task_id="load_plays_to_bigquery",
        bucket=GCS_BUCKET,
        source_objects=["raw/spotify/{{ ds }}/plays_{{ ds }}.json"],
        destination_project_dataset_table=f"{GCP_PROJECT}.{BQ_DATASET}.raw_plays",
        source_format="NEWLINE_DELIMITED_JSON",
        write_disposition="WRITE_APPEND",
        time_partitioning={"type": "DAY", "field": "played_at"},
        create_disposition="CREATE_IF_NEEDED",
        autodetect=False,
        ignore_unknown_values=True,
    )

    ingest >> validate >> load_plays
