variable "region" {
  type    = string
  default = "us-west-2"
}

variable "project" {
  type    = string
  default = "lab1"
}

variable "db_username" {
  description = "Master username for the Aurora cluster"
  type        = string
}

variable "db_password" {
  description = "Master password for the Aurora cluster"
  type        = string
  sensitive   = true
}
