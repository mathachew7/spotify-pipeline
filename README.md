# Wavelength — Spotify Listening History Pipeline

A full-stack data pipeline that pulls your Spotify listening history, enriches it with audio features, stores it in BigQuery, and renders it as an interactive force-graph dashboard.

---

## What it does

Every day, an Airflow job fetches your recently-played tracks from the Spotify API, adds audio-feature data (energy, valence, danceability, tempo, …), and lands everything in BigQuery. A React dashboard reads that data and turns it into:

- **Force graph** — each bubble is a track. Size = how often you played it. Colour = energy level (green → calm, amber → mid, red → intense). Edges connect tracks that sound similar (cosine similarity on 7 audio features, k-NN k=3 so each node connects to its 3 closest sonic neighbours).
- **Mood timeline** — average energy and valence per day so you can see how your listening shifts over time.
- **Listening heatmap** — day-of-week × hour grid showing when you listen most, clickable to see which tracks played at that exact slot.
- **Top artists bar** — click any artist to filter the entire dashboard to that artist's tracks.
- **Track detail panel** — click any bubble for a full breakdown: album art, play history, per-feature progress bars, and a radar chart.

---

## Stack

| Layer | Tech |
|-------|------|
| Orchestration | Apache Airflow 2.8 (Docker) |
| Ingestion | Python 3.11, Spotify Web API |
| Storage | Google Cloud Storage (landing), BigQuery (warehouse) |
| Transformation | dbt Core |
| Infrastructure | Terraform (GCP + Vercel) |
| Dashboard | React 18, Vite, TypeScript strict, Tailwind CSS v3 |
| Visualisation | D3.js v7 (force simulation), Recharts |
| Animation | Framer Motion |
| State | Zustand + React Query |
| Hosting | Vercel |

---

## Project layout

```
spotify-pipeline/
├── dags/                    # Airflow DAG — daily ingestion
│   └── spotify_ingestion_dag.py
├── loaders/                 # Python helpers (Spotify client, GCS, BQ)
├── dbt/                     # dbt models (staging → mart)
├── dashboard/               # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ForceGraph/  # D3 force graph + node/edge rendering
│       │   ├── Charts/      # MoodTimeline, ListeningHeatmap, AudioRadar, TopArtistsBar
│       │   └── Layout/      # TopBar, Sidebar, DataUploader
│       ├── hooks/           # useForceSimulation, useAudioSimilarity, useSpotifyData
│       ├── store/           # Zustand dashboard store
│       ├── types/           # TypeScript types (EnrichedTrack, ForceNode, …)
│       └── utils/           # audioFeatures helpers (cosine similarity, colour mapping)
├── terraform/               # IaC: GCS bucket, BigQuery, IAM, Vercel project
│   ├── modules/
│   │   ├── gcp/             # GCS + BigQuery resources
│   │   ├── iam/             # Service account + roles
│   │   └── vercel/          # Vercel project + deployment
│   └── main.tf
├── docker-compose.yml       # Airflow local setup
└── requirements.txt
```

---

## Local setup

### 1 — Dashboard (mock data, no GCP needed)

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

The app starts in **mock mode** — 30 pre-generated tracks with realistic audio features and play histories so you can explore all visualisations without any credentials.

### 2 — Airflow pipeline (Docker)

```bash
# copy and fill in your credentials
cp .env.example .env

docker-compose up -d
# Airflow UI → http://localhost:8080  (admin / admin)
```

Required env vars:

| Variable | Where to get it |
|----------|----------------|
| `SPOTIFY_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | same |
| `SPOTIFY_REFRESH_TOKEN` | run `scripts/get_refresh_token.py` |
| `GCS_BUCKET` | your GCS bucket name |
| `BQ_DATASET` | e.g. `spotify_raw` |
| `GOOGLE_APPLICATION_CREDENTIALS` | path to service-account JSON |

The DAG runs daily at 06:00 UTC. It:
1. Fetches up to 200 recently-played tracks (cursor-paginated)
2. Batch-fetches audio features (100 tracks per request)
3. Uploads a JSON file to GCS (`raw/plays/YYYY-MM-DD.json`)
4. Loads the file into BigQuery

### 3 — dbt transforms

```bash
cd dbt
pip install dbt-bigquery
dbt run
dbt test
```

### 4 — Terraform (GCP + Vercel)

```bash
cd terraform

# create terraform.tfvars from the example
cp terraform.tfvars.example terraform.tfvars
# fill in project_id, region, vercel_api_token, …

terraform init
terraform plan
terraform apply
```

Feature flags in `terraform.tfvars`:

```hcl
enable_gcp    = true   # provisions GCS bucket + BigQuery + IAM
enable_vercel = true   # provisions Vercel project + initial deploy
```

---

## How the force graph works

Each track becomes a node. Two audio-feature vectors are compared with **cosine similarity** across 7 dimensions: danceability, energy, valence, acousticness, instrumentalness, speechiness, liveness.

Instead of a global threshold (which connects ~88% of pairs for pop music — too noisy), the graph uses **k-nearest neighbours (k=3)**: each track connects only to its 3 most similar peers. This gives ~50 meaningful edges for 30 tracks — a readable structure where clusters of similar-sounding tracks emerge naturally.

Node physics runs as a D3 v7 force simulation:
- Link distance 80, strength 0.3 (pulls similar tracks together)
- Many-body charge −120 (pushes nodes apart)
- Collision detection at radius+6 (prevents overlap)

**Interactions:**
- Drag a bubble to pin it at that position and reshape the graph
- Double-click a pinned bubble to release it back into physics
- Click a bubble to open the detail panel (all others dim)
- Click an artist in the sidebar to filter the whole dashboard

---

## Real data snapshot

Running against a real Spotify account over 30 days produces something like:

```
Tracks analysed:   30
Unique artists:     9
Total plays:       47
Date range:  May 1 – May 31, 2026
Peak hour:   11pm–12am (Friday)

Energy distribution:
  Calm  (< 35%)  ████░░░░░░  8 tracks
  Mid   (35–70%) ██████░░░░ 14 tracks
  Hype  (> 70%)  ████████░░  8 tracks

Top sonic cluster: high-energy / high-valence tracks (🔥)
  — connected by short edges, appear as a tight knot
  in the upper-right of the graph
```

---

## Dashboard features at a glance

| Feature | Where |
|---------|-------|
| Bubble size | Play count |
| Bubble colour | Energy (green → amber → red) |
| Bubble pulse speed | Recency (faster = more recently played) |
| Edge thickness / opacity | Cosine similarity (thicker = more similar) |
| Time filter (7d / 30d / 90d / all) | Top bar |
| Artist filter | Sidebar → Top Artists — click any row |
| Mood timeline | Sidebar — avg energy + valence per day |
| Listening heatmap | Sidebar — day × hour grid, click cell for track list |
| Track detail | Click any bubble — audio features, radar, play history |
| Zoom / pan | Scroll or use +/− buttons; drag background to pan |
| Pin / unpin node | Drag to pin; double-click to release |

---

## Connect your real data

In the top bar, click **Connect** and choose:

- **Spotify token** — paste a short-lived access token to pull your live recently-played data directly in the browser (no backend needed)
- **Upload JSON** — drop an export file from the Airflow pipeline
