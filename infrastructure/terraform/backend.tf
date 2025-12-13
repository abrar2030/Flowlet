# Backend Configuration
# 
# This file configures where Terraform stores its state file.
# 
# For local development, use local backend (default - no configuration needed)
# For production, uncomment and configure the S3 backend below

# Local Backend (Default) - Uncomment for local development
# State file stored in terraform.tfstate in the current directory
# No additional configuration needed

# Remote Backend (S3) - Uncomment for production use
# Requires:
# 1. Pre-existing S3 bucket for state storage
# 2. Pre-existing DynamoDB table for state locking
# 3. AWS credentials configured
#
# To enable, uncomment the block below and run: terraform init -reconfigure

/*
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket-name"  # Replace with your S3 bucket
    key            = "flowlet/terraform.tfstate"
    region         = "us-west-2"                         # Replace with your region
    encrypt        = true
    dynamodb_table = "your-terraform-lock-table-name"    # Replace with your DynamoDB table
    
    # Optional: Use named AWS profile
    # profile = "your-aws-profile"
  }
}
*/

# Creating the backend resources (one-time setup)
# Run this first to create the S3 bucket and DynamoDB table:
#
# terraform init
# terraform apply -target=aws_s3_bucket.terraform_state -target=aws_dynamodb_table.terraform_lock
#
# Then uncomment the backend block above and run: terraform init -reconfigure
