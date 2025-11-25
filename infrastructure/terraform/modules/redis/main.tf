# Redis Module: main.tf

resource "aws_elasticache_subnet_group" "default" {
  name       = "${var.name_prefix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_elasticache_replication_group" "default" {
  replication_group_id         = "${var.name_prefix}-redis"
  description                  = "Redis cluster for Flowlet application"

  node_type                    = var.redis_node_type
  port                         = 6379
  parameter_group_name         = "default.redis7"

  num_cache_clusters           = var.redis_num_cache_nodes

  subnet_group_name            = aws_elasticache_subnet_group.default.name
  security_group_ids           = var.security_group_ids

  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true
  auth_token                   = var.redis_auth_token

  automatic_failover_enabled   = var.redis_num_cache_nodes > 1
  multi_az_enabled             = var.redis_num_cache_nodes > 1

  snapshot_retention_limit     = 5
  snapshot_window              = "03:00-05:00"

  tags = var.tags
}
