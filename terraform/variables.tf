# ── GCP ──────────────────────────────────────────────────────────────────

variable "gcp_project_id" {
  description = "GCP project ID where all resources will be created."
  type        = string
}

variable "gcp_region" {
  description = "Primary GCP region."
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "Primary GCP zone (used for Composer if enabled)."
  type        = string
  default     = "us-central1-a"
}

# ── GCS ──────────────────────────────────────────────────────────────────

variable "gcs_bucket_name" {
  description = "Name of the GCS bucket for raw Spotify JSON. Must be globally unique."
  type        = string
  default     = ""  # defaults to "{project_id}-spotify-raw" in the module
}

variable "gcs_location" {
  description = "GCS bucket location (multi-region or region)."
  type        = string
  default     = "US"
}

# ── BigQuery ─────────────────────────────────────────────────────────────

variable "bq_dataset_id" {
  description = "BigQuery dataset ID for the Spotify warehouse."
  type        = string
  default     = "spotify_warehouse"
}

variable "bq_location" {
  description = "BigQuery dataset location."
  type        = string
  default     = "US"
}

# ── IAM / Service account ─────────────────────────────────────────────────

variable "sa_name" {
  description = "Name of the service account used by Airflow and dbt."
  type        = string
  default     = "spotify-pipeline-sa"
}

# ── Vercel ────────────────────────────────────────────────────────────────

variable "vercel_api_token" {
  description = "Vercel API token. Generate at vercel.com/account/tokens."
  type        = string
  sensitive   = true
  default     = ""
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional; leave empty for personal accounts)."
  type        = string
  default     = ""
}

variable "vercel_project_name" {
  description = "Name of the Vercel project for the dashboard."
  type        = string
  default     = "wavelength-dashboard"
}

# ── Feature flags ─────────────────────────────────────────────────────────

variable "enable_gcp" {
  description = "Set to false to skip all GCP resource creation (e.g. dashboard-only mode)."
  type        = bool
  default     = true
}

variable "enable_vercel" {
  description = "Set to false to skip Vercel project creation."
  type        = bool
  default     = true
}
