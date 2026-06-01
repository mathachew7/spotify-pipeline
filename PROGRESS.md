# Wavelength — Build Progress

## Built ✅

### Dashboard (React + Vite + TypeScript)
- Full project scaffold: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `index.html`
- **Types** — `src/types/spotify.ts`: all Spotify API interfaces + D3 `ForceNode`/`ForceEdge` types
- **Mock data** — `src/utils/mockData.ts`: 30 real tracks (Blinding Lights → Surrender) with play history across 7 days
- **Audio utils** — `src/utils/audioFeatures.ts`: cosine similarity, energy→color gradient, pulse speed, radius scaling
- **Zustand store** — `src/store/dashboardStore.ts`: selected track, hover state, time range + energy filters
- **Hooks**
  - `useForceSimulation.ts` — D3 force sim (link/charge/collide/center), exposes mutable node positions
  - `useAudioSimilarity.ts` — cosine similarity matrix → edges (threshold 0.75)
  - `useSpotifyData.ts` — React Query, supports `mock` / `token` / `bigquery` mode
- **Force Graph** (D3 v7 + Framer Motion)
  - `ForceGraph.tsx` — SVG canvas, D3 zoom/pan, edges with similarity-mapped opacity
  - `GraphNode.tsx` — energy-coloured nodes, pulse ring animation, hover glow, click selection
  - `GraphControls.tsx` — time range tabs, energy range sliders, zoom ⊕/⊖
  - `TrackDetailPanel.tsx` — slide-in panel: feature bars, radar chart, play history
- **Charts** (Recharts)
  - `ListeningHeatmap.tsx` — hour × day-of-week grid, green intensity = play count
  - `TopArtistsBar.tsx` — animated horizontal bar chart, ranked by play count
  - `MoodTimeline.tsx` — daily avg energy + valence line chart
  - `AudioRadar.tsx` — SVG hexagonal radar for per-track audio features
- **Layout**
  - `TopBar.tsx` — logo, stats, data-source badge, Connect button
  - `Sidebar.tsx` — collapsible left panel housing all charts + stat grid
  - `DataUploader.tsx` — modal: paste Spotify token OR drag-drop JSON
- **App.tsx + main.tsx + index.css** — QueryClient provider, layout wiring

### Infrastructure (Terraform)
- **`terraform/`** — modular layout: `gcp`, `iam`, `vercel` modules
- **GCP module** — enables APIs, GCS bucket (versioned, lifecycle rules), BigQuery dataset + `raw_plays` + `raw_audio_features` tables (partitioned)
- **IAM module** — service account with GCS object admin, BQ data editor, job user, Secret Manager accessor roles
- **Vercel module** — Vercel project + initial deployment, env vars via input map
- **`providers.tf`** — Google 5.x + Vercel 1.x providers; GCS remote backend commented in for later
- **`variables.tf`** — `enable_gcp` / `enable_vercel` feature flags for incremental apply
- **`terraform.tfvars.example`** — safe template (never committed with real values)

### Pipeline (Backend — ready, not yet wired to live GCP)
- **`docker-compose.yml`** — Airflow 2.9.1 + Postgres 15 + dbt container
- **`dags/spotify_ingestion_dag.py`** — daily DAG: OAuth refresh → cursor-paginated recently-played → audio features batch → GCS upload → BigQuery load; exponential backoff retries
- **`loaders/gcs_to_bigquery.py`** — standalone backfill script (`--date` or `--backfill N`)
- **`scripts/get_spotify_token.py`** — one-time OAuth PKCE flow → prints refresh token
- **dbt models**
  - `staging/stg_tracks.sql` — deduped plays, exploded artist arrays, time dims
  - `staging/stg_audio_features.sql` — clamped features, mood bucket derivation
  - `marts/fct_listening_sessions.sql` — core fact table, partitioned by day
  - `marts/fct_top_artists.sql` — artist play counts + audio feature profile
  - `marts/fct_genre_clusters.sql` — track feature vectors for graph similarity

---

## In Progress 🔧
- Vercel deploy config (`vercel.json`)
- `dbt/sources.yml` — source definitions for staging models
- DataUploader JSON → React Query cache injection (step 8)

## Pending ⏳
- Wire dashboard to real BigQuery via API endpoint
- `terraform apply` with real GCP project + Vercel token
- Final README with setup screenshots
- Vercel deployment

---

## How to run (current state)

### Dashboard (mock data — works today)
```bash
cd dashboard
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # 0 errors ✓
npm run build        # production build
```

### Airflow (needs GCP creds)
```bash
cp .env.example .env          # fill in Spotify + GCP values
python scripts/get_spotify_token.py   # one-time: get refresh token
mkdir keys && <place service_account.json here>
docker-compose up airflow-init
docker-compose up -d
# Airflow UI → http://localhost:8080  (admin/admin)
```

### Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in values
terraform init
terraform plan
terraform apply      # provisions GCS + BigQuery + Vercel
```

### dbt (after Terraform apply)
```bash
docker-compose run --rm dbt dbt run
docker-compose run --rm dbt dbt test
```

---

## Open questions / blockers
- GCP project ID needed to run `terraform apply`
- Spotify Developer App needed for OAuth → refresh token
- Vercel API token needed for Terraform Vercel module
