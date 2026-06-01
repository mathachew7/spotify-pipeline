output "gcs_bucket_name" {
  description = "GCS bucket for raw Spotify JSON."
  value       = var.enable_gcp ? module.gcp[0].bucket_name : "GCP disabled"
}

output "bigquery_dataset" {
  description = "BigQuery dataset ID."
  value       = var.enable_gcp ? module.gcp[0].dataset_id : "GCP disabled"
}

output "service_account_email" {
  description = "Service account email for Airflow + dbt."
  value       = var.enable_gcp ? module.iam[0].service_account_email : "GCP disabled"
}

output "service_account_key_path" {
  description = "Path to download the SA key (run: gcloud iam service-accounts keys create)."
  value       = var.enable_gcp ? "See module iam — key not auto-created for security" : "GCP disabled"
}

output "vercel_project_id" {
  description = "Vercel project ID."
  value       = var.enable_vercel ? module.vercel[0].project_id : "Vercel disabled"
}

output "vercel_deployment_url" {
  description = "Production URL of the deployed dashboard."
  value       = var.enable_vercel ? module.vercel[0].deployment_url : "Vercel disabled"
}
