terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = var.terraform_state_bucket
    key            = "flowlet/terraform.tfstate"
    region         = var.aws_region
    encrypt        = true
    dynamodb_table = var.terraform_lock_table
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Flowlet"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "kubernetes" {
  host                   = module.kubernetes.cluster_endpoint
  cluster_ca_certificate = base64decode(module.kubernetes.cluster_ca_certificate)
  token                  = module.kubernetes.cluster_token
}

provider "helm" {
  kubernetes {
    host                   = module.kubernetes.cluster_endpoint
    cluster_ca_certificate = base64decode(module.kubernetes.cluster_ca_certificate)
    token                  = module.kubernetes.cluster_token
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }

  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# Networking Module
module "networking" {
  source = "./modules/networking"

  name_prefix = local.name_prefix
  vpc_cidr    = var.vpc_cidr
  azs         = local.azs

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway

  tags = local.common_tags
}

# Security Module
module "security" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id

  allowed_cidr_blocks = var.allowed_cidr_blocks

  tags = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"

  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id

  private_subnet_ids = module.networking.private_subnet_ids
  security_group_ids = [module.security.database_security_group_id]

  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_engine_version    = var.db_engine_version

  db_name     = var.db_name
  db_username = var.db_username

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  enable_encryption = var.enable_encryption

  tags = local.common_tags
}

# Kubernetes Module
module "kubernetes" {
  source = "./modules/kubernetes"

  name_prefix = local.name_prefix
  vpc_id      = module.networking.vpc_id

  private_subnet_ids = module.networking.private_subnet_ids
  public_subnet_ids  = module.networking.public_subnet_ids

  cluster_version = var.cluster_version

  node_groups = var.node_groups

  enable_irsa                    = var.enable_irsa
  enable_cluster_autoscaler      = var.enable_cluster_autoscaler
  enable_aws_load_balancer_controller = var.enable_aws_load_balancer_controller

  tags = local.common_tags
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store database password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  description             = "Database password for Flowlet application"
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# ElastiCache Redis cluster
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis"
  subnet_ids = module.networking.private_subnet_ids

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id         = "${local.name_prefix}-redis"
  description                  = "Redis cluster for Flowlet application"

  node_type                    = var.redis_node_type
  port                         = 6379
  parameter_group_name         = "default.redis7"

  num_cache_clusters           = var.redis_num_cache_nodes

  subnet_group_name            = aws_elasticache_subnet_group.redis.name
  security_group_ids           = [module.security.redis_security_group_id]

  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = random_password.redis_auth_token.result

  automatic_failover_enabled   = var.redis_num_cache_nodes > 1
  multi_az_enabled            = var.redis_num_cache_nodes > 1

  snapshot_retention_limit     = 5
  snapshot_window             = "03:00-05:00"

  tags = local.common_tags
}

resource "random_password" "redis_auth_token" {
  length  = 32
  special = false
}

# S3 bucket for application assets
resource "aws_s3_bucket" "app_assets" {
  bucket = "${local.name_prefix}-app-assets"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_assets" {
  bucket = aws_s3_bucket.app_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
