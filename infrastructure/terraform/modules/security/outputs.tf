output "eks_security_group_id" {
  description = "ID of the EKS cluster security group"
  value       = aws_security_group.eks_cluster.id
}

output "eks_nodes_security_group_id" {
  description = "ID of the EKS nodes security group"
  value       = aws_security_group.eks_nodes.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "private_network_acl_id" {
  description = "ID of the private network ACL"
  value       = aws_network_acl.private.id
}
