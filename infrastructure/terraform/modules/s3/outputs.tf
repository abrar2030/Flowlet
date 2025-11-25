# S3 Module: outputs.tf

output "s3_bucket_id" {
  description = "The ID of the S3 bucket for application assets."
  value       = aws_s3_bucket.app_assets.id
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket for application assets."
  value       = aws_s3_bucket.app_assets.arn
}
