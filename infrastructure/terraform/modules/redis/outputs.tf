# Redis Module: outputs.tf

output "redis_endpoint" {
  description = "The primary endpoint of the Redis replication group."
  value       = aws_elasticache_replication_group.default.primary_endpoint_address
}

output "redis_port" {
  description = "The port of the Redis replication group."
  value       = aws_elasticache_replication_group.default.port
}
