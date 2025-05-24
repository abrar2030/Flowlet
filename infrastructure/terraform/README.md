# Infrastructure as Code - Terraform

This directory contains Terraform configurations for provisioning the cloud infrastructure required by Flowlet.

## Structure

- `main.tf` - Main Terraform configuration file
- `variables.tf` - Variable definitions
- `outputs.tf` - Output definitions
- `environments/` - Environment-specific variable files
  - `development.tfvars`
  - `staging.tfvars`
  - `production.tfvars`
- `modules/` - Reusable Terraform modules
  - `kubernetes/` - Kubernetes cluster configuration
  - `database/` - Database resources
  - `networking/` - Network infrastructure
  - `security/` - Security resources

## Usage

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file=environments/development.tfvars

# Apply changes
terraform apply -var-file=environments/development.tfvars
```

## Requirements

- Terraform v1.0+
- AWS, GCP, or Azure credentials configured
