output "bucket_name" {
  value = google_storage_bucket.raw.name
}

output "dataset_id" {
  value = google_bigquery_dataset.warehouse.dataset_id
}

output "raw_plays_table_id" {
  value = google_bigquery_table.raw_plays.table_id
}

output "raw_audio_features_table_id" {
  value = google_bigquery_table.raw_audio_features.table_id
}
