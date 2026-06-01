# Service account used by Airflow DAGs and dbt
resource "google_service_account" "pipeline" {
  account_id   = var.sa_name
  display_name = "Wavelength Pipeline SA"
  description  = "Used by Airflow (GCS write) and dbt (BigQuery read/write)"
  project      = var.project_id
}

# GCS: write raw JSON, read for BigQuery load
resource "google_storage_bucket_iam_member" "sa_gcs_writer" {
  bucket = var.bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.pipeline.email}"
}

# BigQuery: data editor on the warehouse dataset
resource "google_bigquery_dataset_iam_member" "sa_bq_editor" {
  dataset_id = var.dataset_id
  project    = var.project_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.pipeline.email}"
}

# BigQuery: job runner (needed to run queries / loads)
resource "google_project_iam_member" "sa_bq_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.pipeline.email}"
}

# Secret Manager: let the SA read secrets (Spotify credentials)
resource "google_project_iam_member" "sa_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.pipeline.email}"
}
