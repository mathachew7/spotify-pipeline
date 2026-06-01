locals {
  bucket_name = var.gcs_bucket_name != "" ? var.gcs_bucket_name : "${var.gcp_project_id}-spotify-raw"
}

# ── GCP infrastructure ────────────────────────────────────────────────────

module "gcp" {
  source = "./modules/gcp"
  count  = var.enable_gcp ? 1 : 0

  project_id   = var.gcp_project_id
  region       = var.gcp_region
  bucket_name  = local.bucket_name
  bucket_location = var.gcs_location
  dataset_id   = var.bq_dataset_id
  bq_location  = var.bq_location
}

module "iam" {
  source = "./modules/iam"
  count  = var.enable_gcp ? 1 : 0

  project_id   = var.gcp_project_id
  sa_name      = var.sa_name
  bucket_name  = local.bucket_name
  dataset_id   = var.bq_dataset_id

  depends_on = [module.gcp]
}

# ── Vercel deployment ────────────────────────────────────────────────────

module "vercel" {
  source = "./modules/vercel"
  count  = var.enable_vercel ? 1 : 0

  project_name = var.vercel_project_name
  team_id      = var.vercel_team_id

  environment_variables = {
    VITE_DATA_MODE        = "mock"
    VITE_BQ_API_ENDPOINT  = ""   # fill in once your BQ API is live
  }
}
