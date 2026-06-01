"""
Standalone GCS → BigQuery loader.
Can be run directly (python loaders/gcs_to_bigquery.py --date 2024-01-15)
or imported by the Airflow DAG.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
from datetime import date, timedelta
from typing import Any

from google.cloud import bigquery, storage

log = logging.getLogger(__name__)

GCS_BUCKET = os.environ["GCS_BUCKET"]
GCP_PROJECT = os.environ["GCP_PROJECT_ID"]
BQ_DATASET = os.environ.get("BQ_DATASET", "spotify_warehouse")


def load_date(run_date: date) -> None:
    date_str = run_date.isoformat()
    gcs_path = f"raw/spotify/{date_str}/plays_{date_str}.json"

    storage_client = storage.Client(project=GCP_PROJECT)
    bq_client = bigquery.Client(project=GCP_PROJECT)

    bucket = storage_client.bucket(GCS_BUCKET)
    blob = bucket.blob(gcs_path)

    if not blob.exists():
        log.warning("gs://%s/%s not found, skipping", GCS_BUCKET, gcs_path)
        return

    raw_data: dict[str, Any] = json.loads(blob.download_as_text())
    ingested_at = raw_data.get("_ingested_at", date_str)

    # ── Load plays ────────────────────────────────────────────────────────
    plays_rows = []
    for item in raw_data.get("plays", []):
        track = item.get("track", {})
        artists = track.get("artists", [])
        ctx = item.get("context")
        plays_rows.append({
            "played_at": item.get("played_at"),
            "track_id": track.get("id"),
            "track_name": track.get("name"),
            "artist_ids": ",".join(a.get("id", "") for a in artists),
            "artist_names": ",".join(a.get("name", "") for a in artists),
            "album_id": track.get("album", {}).get("id"),
            "album_name": track.get("album", {}).get("name"),
            "context_type": ctx.get("type") if ctx else None,
            "context_uri": ctx.get("uri") if ctx else None,
            "_ingested_at": ingested_at,
            "_date_partition": date_str,
        })

    plays_table = bq_client.get_table(f"{GCP_PROJECT}.{BQ_DATASET}.raw_plays")
    errors = bq_client.insert_rows_json(plays_table, plays_rows)
    if errors:
        raise RuntimeError(f"BigQuery insert errors (plays): {errors}")
    log.info("Loaded %d play rows for %s", len(plays_rows), date_str)

    # ── Load audio features ───────────────────────────────────────────────
    features_rows = []
    for feat in raw_data.get("audio_features", []):
        features_rows.append({
            "track_id": feat.get("id"),
            "danceability": feat.get("danceability"),
            "energy": feat.get("energy"),
            "key": feat.get("key"),
            "loudness": feat.get("loudness"),
            "mode": feat.get("mode"),
            "speechiness": feat.get("speechiness"),
            "acousticness": feat.get("acousticness"),
            "instrumentalness": feat.get("instrumentalness"),
            "liveness": feat.get("liveness"),
            "valence": feat.get("valence"),
            "tempo": feat.get("tempo"),
            "duration_ms": feat.get("duration_ms"),
            "time_signature": feat.get("time_signature"),
            "_ingested_at": ingested_at,
        })

    features_table = bq_client.get_table(f"{GCP_PROJECT}.{BQ_DATASET}.raw_audio_features")
    errors = bq_client.insert_rows_json(features_table, features_rows)
    if errors:
        raise RuntimeError(f"BigQuery insert errors (audio features): {errors}")
    log.info("Loaded %d audio feature rows for %s", len(features_rows), date_str)


def backfill(days: int = 7) -> None:
    today = date.today()
    for i in range(days):
        load_date(today - timedelta(days=i))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", help="YYYY-MM-DD to load (default: today)")
    parser.add_argument("--backfill", type=int, help="Load last N days")
    args = parser.parse_args()

    if args.backfill:
        backfill(args.backfill)
    else:
        target = date.fromisoformat(args.date) if args.date else date.today()
        load_date(target)
