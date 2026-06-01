output "project_id" {
  value = vercel_project.dashboard.id
}

output "deployment_url" {
  value = "https://${var.project_name}.vercel.app"
}
