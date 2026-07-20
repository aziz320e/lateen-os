variable "cluster_name" { type = string }
variable "environment" { type = string }
variable "region" { type = string }

variable "node_count" {
  type    = number
  default = 3
}

variable "node_instance_type" {
  type    = string
  default = "t3.large"
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"

  tags = {
    environment = var.environment
    platform    = "lateen-os"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = var.node_count
      max_size     = var.node_count * 2
      desired_size = var.node_count
      instance_types = [var.node_instance_type]
    }
  }

  tags = {
    environment = var.environment
    platform    = "lateen-os"
  }
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  value = module.eks.cluster_name
}
