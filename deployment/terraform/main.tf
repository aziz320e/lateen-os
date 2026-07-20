terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }
}

variable "cloud_provider" {
  description = "Target cloud: azure, aws, or digitalocean"
  type        = string
  validation {
    condition     = contains(["azure", "aws", "digitalocean"], var.cloud_provider)
    error_message = "cloud_provider must be azure, aws, or digitalocean."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "cluster_name" {
  description = "Kubernetes cluster name"
  type        = string
  default     = "lateen-os"
}

variable "region" {
  description = "Cloud region"
  type        = string
}

module "azure" {
  count  = var.cloud_provider == "azure" ? 1 : 0
  source = "./modules/azure"

  cluster_name = var.cluster_name
  environment  = var.environment
  region       = var.region
}

module "aws" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"

  cluster_name = var.cluster_name
  environment  = var.environment
  region       = var.region
}

module "digitalocean" {
  count  = var.cloud_provider == "digitalocean" ? 1 : 0
  source = "./modules/digitalocean"

  cluster_name = var.cluster_name
  environment  = var.environment
  region       = var.region
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value = coalesce(
    try(module.azure[0].cluster_endpoint, null),
    try(module.aws[0].cluster_endpoint, null),
    try(module.digitalocean[0].cluster_endpoint, null),
  )
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value = coalesce(
    try(module.azure[0].cluster_name, null),
    try(module.aws[0].cluster_name, null),
    try(module.digitalocean[0].cluster_name, null),
  )
}
