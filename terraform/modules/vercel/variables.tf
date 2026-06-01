variable "project_name" {
  type    = string
  default = "wavelength-dashboard"
}

variable "team_id" {
  type    = string
  default = ""
}

variable "environment_variables" {
  description = "Map of env var name → value to set on the Vercel project."
  type        = map(string)
  default     = {}
}
