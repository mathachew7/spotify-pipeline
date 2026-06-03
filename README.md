# Wavelength — Spotify Listening History Pipeline

A full-stack data pipeline that pulls your Spotify listening history, enriches it with audio features, stores it in BigQuery, and renders it as an interactive force-graph dashboard.

---

## What it does

Every day, an Airflow job fetches your recently-played tracks from the Spotify API, adds audio-feature data (energy, valence, danceability, tempo, …), and lands everything in BigQuery. A React dashboard reads that data and turns it into:

- **Force graph** — each bubble is a track. Size = how often you played it. Colour = energy level (green → calm, amber → mid, red → intense). Edges connect tracks that sound similar (cosine similarity on 7 audio features, k-NN k=5).
- **Mood timeline** — average energy and valence per day so you can see how your listening shifts over time.
- **Listening heatmap** — day-of-week × hour grid showing when you listen most; click any cell to highlight exactly those tracks on the force graph.
- **Top artists bar** — click any artist to filter the entire dashboard to that artist's tracks.
- **Track detail panel** — click any bubble for a full breakdown: album art, 30-second audio preview, play history, per-feature progress bars, and a radar chart.

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
| Auth | Spotify OAuth 2.0 PKCE (browser-only, no backend) |
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
│       │   ├── ForceGraph/  # D3 force graph, node/edge rendering, search, export
│       │   ├── Charts/      # MoodTimeline, ListeningHeatmap, AudioRadar, TopArtistsBar
│       │   └── Layout/      # TopBar, Sidebar, SpotifyConnect modal
│       ├── hooks/           # useForceSimulation, useAudioSimilarity, useSpotifyData
│       ├── store/           # Zustand dashboard store
│       ├── types/           # TypeScript types (EnrichedTrack, ForceNode, …)
│       └── utils/           # audioFeatures helpers, spotifyAuth (PKCE flow)
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

### 1 — Dashboard (mock data, no credentials needed)

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

The app starts in **mock mode** with 30 pre-generated tracks spread across realistic time windows (1d → 90d → all), so every time-range filter shows a different subset. All visualisations and interactions work without any credentials.

### 2 — Connect your real Spotify account

Click **Connect Spotify** in the top bar. The modal walks you through three steps:

1. Create a free app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Add your redirect URI (shown in the modal) to that app's settings
3. Paste your **Client ID** and click **Connect with Spotify**

The app uses the **OAuth 2.0 PKCE flow** — no backend, no client secret. Your access token is stored in `localStorage` and refreshed automatically. Your real recently-played tracks and audio features load immediately after authorising.

### 3 — Airflow pipeline (Docker)

```bash
cp .env.example .env   # fill in credentials
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

### 4 — dbt transforms

```bash
cd dbt
pip install dbt-bigquery
dbt run
dbt test
```

### 5 — Terraform (GCP + Vercel)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform plan && terraform apply
```

Feature flags in `terraform.tfvars`:

```hcl
enable_gcp    = true   # provisions GCS bucket + BigQuery + IAM
enable_vercel = true   # provisions Vercel project + initial deploy
```

---

## How the force graph works

Each track becomes a node. Two audio-feature vectors are compared with **cosine similarity** across 7 dimensions: danceability, energy, valence, acousticness, instrumentalness, speechiness, liveness.

The graph uses **k-nearest neighbours (k=5)**: each track connects to its 5 most similar peers. Edge opacity scales with similarity — stronger connections appear brighter.

Node physics: D3 v7 force simulation with link distance 80, many-body repulsion −120, and collision detection at radius+6.

**Interactions:**
- **Drag** any bubble independently — pointer capture ensures only that node moves; connected nodes rearrange via live physics. Drop to pin.
- **Double-click** a pinned node to release it back into physics.
- **Click** a bubble to open the detail panel (others dim).
- **Search** (top centre) — type a track or artist; matching nodes stay lit, everything else dims.
- **Heatmap cross-highlight** — clicking a day/hour cell in the listening heatmap highlights those exact tracks on the graph.
- **Export** — the `↓` button in the zoom controls saves the current graph as a 2× PNG.

---

## Dashboard features at a glance

| Feature | Detail |
|---------|--------|
| Bubble size | Play count in the selected time window |
| Bubble colour | Energy (green → amber → red) |
| Bubble pulse speed | Recency (faster = played more recently) |
| Edge opacity | Cosine similarity (brighter = more similar) |
| Time filter | 1d / 3d / 7d / 30d / 90d / All |
| Artist filter | Sidebar → Top Artists — click any row |
| Heatmap highlight | Click any day×hour cell → matching bubbles light up |
| Search highlight | Type in search bar → matching bubbles light up |
| Audio preview | Click a bubble → 30s Spotify preview in the detail panel |
| Export PNG | `↓` button in zoom controls |
| Mood timeline | Sidebar — avg energy + valence per day |
| Track detail | Album art, genres, feature bars, radar chart, play history |
| Zoom / pan | Scroll or +/− buttons; drag background to pan |
| Pin / unpin node | Drag to pin; double-click to release |

---

## Connecting real data

Click **Connect Spotify** in the top bar. The PKCE flow runs entirely in the browser — no server needed. After authorising, the dashboard switches from mock data to your real listening history automatically. Your avatar and display name appear in the top bar while connected.

To disconnect, click your name in the top bar → **Disconnect**.
