variable "cluster_name" { type = string }
variable "environment" { type = string }
variable "region" { type = string }

variable "node_count" {
  type    = number
  default = 3
}

variable "node_vm_size" {
  type    = string
  default = "Standard_D4s_v3"
}

resource "azurerm_resource_group" "this" {
  name     = "${var.cluster_name}-rg"
  location = var.region
  tags = {
    environment = var.environment
    platform    = "lateen-os"
  }
}

resource "azurerm_kubernetes_cluster" "this" {
  name                = var.cluster_name
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = "1.29"

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.node_vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
  }

  tags = {
    environment = var.environment
    platform    = "lateen-os"
  }
}

output "cluster_endpoint" {
  value = azurerm_kubernetes_cluster.this.kube_config[0].host
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.this.name
}
