resource "google_project_service" "apis" {
  for_each = toset([
    "storage.googleapis.com",
    "bigquery.googleapis.com",
    "iam.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# ── GCS bucket (raw JSON, date-partitioned by path convention) ────────────

resource "google_storage_bucket" "raw" {
  name          = var.bucket_name
  project       = var.project_id
  location      = var.bucket_location
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { age = 365 }
    action { type = "SetStorageClass"; storage_class = "NEARLINE" }
  }

  lifecycle_rule {
    condition { age = 730 }
    action { type = "SetStorageClass"; storage_class = "COLDLINE" }
  }

  labels = {
    project = "wavelength"
    managed = "terraform"
  }

  depends_on = [google_project_service.apis]
}

# ── BigQuery dataset ──────────────────────────────────────────────────────

resource "google_bigquery_dataset" "warehouse" {
  dataset_id                  = var.dataset_id
  project                     = var.project_id
  location                    = var.bq_location
  delete_contents_on_destroy  = false
  description                 = "Spotify listening history warehouse managed by Wavelength"

  labels = {
    project = "wavelength"
    managed = "terraform"
  }

  depends_on = [google_project_service.apis]
}

# ── BigQuery tables ───────────────────────────────────────────────────────

resource "google_bigquery_table" "raw_plays" {
  dataset_id          = google_bigquery_dataset.warehouse.dataset_id
  table_id            = "raw_plays"
  project             = var.project_id
  deletion_protection = false

  time_partitioning {
    type  = "DAY"
    field = "played_at"
  }

  schema = jsonencode([
    { name = "played_at", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "track_id", type = "STRING", mode = "REQUIRED" },
    { name = "track_name", type = "STRING", mode = "NULLABLE" },
    { name = "artist_ids", type = "STRING", mode = "NULLABLE" },
    { name = "artist_names", type = "STRING", mode = "NULLABLE" },
    { name = "album_id", type = "STRING", mode = "NULLABLE" },
    { name = "album_name", type = "STRING", mode = "NULLABLE" },
    { name = "context_type", type = "STRING", mode = "NULLABLE" },
    { name = "context_uri", type = "STRING", mode = "NULLABLE" },
    { name = "_ingested_at", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "_date_partition", type = "DATE", mode = "REQUIRED" },
  ])
}

resource "google_bigquery_table" "raw_audio_features" {
  dataset_id          = google_bigquery_dataset.warehouse.dataset_id
  table_id            = "raw_audio_features"
  project             = var.project_id
  deletion_protection = false

  schema = jsonencode([
    { name = "track_id", type = "STRING", mode = "REQUIRED" },
    { name = "danceability", type = "FLOAT64", mode = "NULLABLE" },
    { name = "energy", type = "FLOAT64", mode = "NULLABLE" },
    { name = "key", type = "INT64", mode = "NULLABLE" },
    { name = "loudness", type = "FLOAT64", mode = "NULLABLE" },
    { name = "mode", type = "INT64", mode = "NULLABLE" },
    { name = "speechiness", type = "FLOAT64", mode = "NULLABLE" },
    { name = "acousticness", type = "FLOAT64", mode = "NULLABLE" },
    { name = "instrumentalness", type = "FLOAT64", mode = "NULLABLE" },
    { name = "liveness", type = "FLOAT64", mode = "NULLABLE" },
    { name = "valence", type = "FLOAT64", mode = "NULLABLE" },
    { name = "tempo", type = "FLOAT64", mode = "NULLABLE" },
    { name = "duration_ms", type = "INT64", mode = "NULLABLE" },
    { name = "time_signature", type = "INT64", mode = "NULLABLE" },
    { name = "_ingested_at", type = "TIMESTAMP", mode = "REQUIRED" },
  ])
}
