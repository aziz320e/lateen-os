variable "cluster_name" { type = string }
variable "environment" { type = string }
variable "region" { type = string }

variable "node_count" {
  type    = number
  default = 3
}

variable "node_size" {
  type    = string
  default = "s-4vcpu-8gb"
}

resource "digitalocean_kubernetes_cluster" "this" {
  name    = var.cluster_name
  region  = var.region
  version = "1.29.2-do.0"

  node_pool {
    name       = "default"
    size       = var.node_size
    node_count = var.node_count
  }

  tags = ["lateen-os", var.environment]
}

output "cluster_endpoint" {
  value = digitalocean_kubernetes_cluster.this.endpoint
}

output "cluster_name" {
  value = digitalocean_kubernetes_cluster.this.name
}
