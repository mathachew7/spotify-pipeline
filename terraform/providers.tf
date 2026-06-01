terraform {
  required_version = ">= 1.7.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.30"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.11"
    }
  }

  # ── Local state (default) ────────────────────────────────────────────────
  # Switch to GCS remote backend when you're ready:
  #
  # backend "gcs" {
  #   bucket = "YOUR_TERRAFORM_STATE_BUCKET"
  #   prefix = "spotify-pipeline/state"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id   # optional — leave "" for personal accounts
}
