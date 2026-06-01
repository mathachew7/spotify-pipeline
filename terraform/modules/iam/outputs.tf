output "service_account_email" {
  value = google_service_account.pipeline.email
}

output "service_account_id" {
  value = google_service_account.pipeline.account_id
}
