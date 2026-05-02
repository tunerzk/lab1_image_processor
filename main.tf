# Lab 1 Starter Terraform
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

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
