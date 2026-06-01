resource "vercel_project" "dashboard" {
  name      = var.project_name
  framework = "vite"

  # Vercel looks for the Vite project inside the dashboard/ subdirectory
  root_directory = "dashboard"

  git_repository = null  # set to { type="github", repo="org/repo" } once connected

  dynamic "environment" {
    for_each = var.environment_variables
    content {
      key    = environment.key
      value  = environment.value
      target = ["production", "preview"]
    }
  }
}

# Production deployment (triggered by Vercel on git push; this resource
# forces an initial deploy from the current state)
resource "vercel_deployment" "initial" {
  project_id = vercel_project.dashboard.id
  team_id    = var.team_id != "" ? var.team_id : null

  # Path to the built output (relative to repo root)
  # Vite outputs to dashboard/dist by default
  production = true

  lifecycle {
    # Re-deploy only when env vars change via Terraform.
    # Normal deploys happen via git push → Vercel webhook.
    ignore_changes = [vercel_project.dashboard.id]
  }
}
