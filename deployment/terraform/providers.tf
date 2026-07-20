provider "azurerm" {
  features {}
}

provider "aws" {
  region = var.region
}

provider "digitalocean" {}
