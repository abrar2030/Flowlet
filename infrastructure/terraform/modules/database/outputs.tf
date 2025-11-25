# Database Module: outputs.tf

output "db_instance_address" {
  description = "The address of the RDS instance."
  value       = aws_db_instance.default.address
}

output "db_instance_port" {
  description = "The port of the RDS instance."
  value       = aws_db_instance.default.port
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance."
  value       = aws_db_instance.default.arn
}
