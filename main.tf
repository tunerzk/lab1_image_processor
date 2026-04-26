# Lab 1 Starter Terraform
provider "aws" { region = var.region }

resource "aws_s3_bucket" "imagesbucks3" {
  bucket = "${var.project}-imagesbucks3"
}

locals {
  project = var.project

  tags = {
    Project   = local.project
    ManagedBy = "Terraform"
  }
}


# TODO: Add Lambda, EventBridge rule, Aurora cluster, SNS topic
