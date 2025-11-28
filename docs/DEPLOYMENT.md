# Flowlet Infrastructure Deployment Guide

This document outlines the steps required to deploy the Flowlet application infrastructure using Terraform and Kubernetes.

## 1. Prerequisites

Before starting the deployment, ensure you have the following tools installed and configured:

- **AWS CLI**: Configured with credentials that have permissions to create S3 buckets, DynamoDB tables, EKS clusters, RDS, and ElastiCache resources.
- **Terraform (v1.0.0+)**: Installed and accessible in your PATH.
- **kubectl**: Installed and configured to interact with the EKS cluster.
- **Helm (v3+)**: Installed for deploying the application to Kubernetes.
- **Docker**: Installed for building and pushing container images.
- **GitHub/Docker Registry Credentials**: Required for the CI/CD process to push and pull images.

## 2. Infrastructure Provisioning with Terraform

The infrastructure is defined in the `infrastructure/terraform` directory. It uses an S3 backend for state management and a DynamoDB table for state locking.

### 2.1. Configure Terraform Backend

You must first create the S3 bucket and DynamoDB table for the Terraform backend manually or via a separate script.

**Example AWS CLI commands:**

```bash
# Replace with your desired bucket name and region
AWS_REGION="us-west-2"
TF_STATE_BUCKET="flowlet-tfstate-prod-1234567890"
TF_LOCK_TABLE="flowlet-tflock-prod"

# Create S3 Bucket
aws s3api create-bucket \
    --bucket $TF_STATE_BUCKET \
    --region $AWS_REGION \
    --create-bucket-configuration LocationConstraint=$AWS_REGION

# Enable Versioning on the bucket
aws s3api put-bucket-versioning \
    --bucket $TF_STATE_BUCKET \
    --versioning-configuration Status=Enabled

# Create DynamoDB Table for state locking
aws dynamodb create-table \
    --table-name $TF_LOCK_TABLE \
    --region $AWS_REGION \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 2.2. Initialize and Apply Terraform

1.  **Update Variables**: Create a `production.tfvars` file in `infrastructure/terraform` with your production-specific values. A `dev.tfvars` example is provided for reference.

    ```hcl
    # infrastructure/terraform/production.tfvars
    environment = "production"
    terraform_state_bucket = "your-prod-state-bucket"
    terraform_lock_table = "your-prod-lock-table"
    aws_region = "us-west-2"
    # ... other variables
    ```

2.  **Initialize Terraform**:

    ```bash
    cd infrastructure/terraform
    terraform init -backend-config="bucket=your-prod-state-bucket" -backend-config="dynamodb_table=your-prod-lock-table" -backend-config="region=us-west-2"
    ```

3.  **Review and Apply**:
    ```bash
    terraform plan -var-file="production.tfvars"
    terraform apply -var-file="production.tfvars"
    ```

This will provision the VPC, EKS cluster, RDS database, ElastiCache Redis, and S3 assets bucket.

## 3. Application Deployment

The application is deployed to the provisioned EKS cluster using Helm.

### 3.1. Build and Push Docker Images

The CI pipeline (`.github/workflows/docker-build.yml`) handles the automated build and push of the web-frontend and backend images. If deploying manually, use the following steps:

1.  **Build Images**:

    ```bash
    docker build -t your-registry/flowlet/web-frontend:latest -f infrastructure/docker/Dockerfile.web-frontend .
    docker build -t your-registry/flowlet/backend:latest -f infrastructure/docker/Dockerfile.backend .
    ```

2.  **Push Images**:
    ```bash
    docker push your-registry/flowlet/web-frontend:latest
    docker push your-registry/flowlet/backend:latest
    ```

### 3.2. Configure Kubernetes Secrets

The backend application requires sensitive configuration (e.g., database credentials) to be stored in Kubernetes Secrets.

1.  **Create Secret YAML**: Create a YAML file (e.g., `flowlet-secrets.yaml`) with your base64-encoded secrets.

    ```yaml
    # kubernetes/secrets/flowlet-secrets.yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: flowlet-secrets
    type: Opaque
    data:
      # Base64 encoded values
      database_url: <base64_encoded_db_url>
      api_key: <base64_encoded_api_key>
      # ... other secrets
    ```

2.  **Apply Secrets**:
    ```bash
    kubectl apply -f kubernetes/secrets/flowlet-secrets.yaml
    ```

### 3.3. Deploy with Helm

The application is deployed using the `flowlet-chart` Helm chart.

1.  **Update `values.yaml`**: Modify `kubernetes/helm/flowlet-chart/values.yaml` to point to your pushed Docker images and configure any other necessary values.

2.  **Deploy/Upgrade**:
    ```bash
    helm upgrade --install flowlet kubernetes/helm/flowlet-chart --namespace flowlet --create-namespace
    ```

## 4. CI/CD Pipeline

The repository includes two GitHub Actions workflows:

1.  **`terraform-ci.yml`**: Validates Terraform code on every push to `infrastructure/terraform`. It runs `terraform fmt -check`, `terraform validate`, and `terraform plan`.
2.  **`docker-build.yml`**: Builds and pushes the optimized multi-stage Docker images for the web-frontend and backend to a container registry on changes to application or Dockerfile code.

## 5. Key Infrastructure Refactoring Details

| Component                  | Refactoring Detail                                                                                                                         | Benefit                                                                        |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Dockerfiles**            | Converted to optimized multi-stage builds (`Dockerfile.web-frontend`, `Dockerfile.backend`).                                               | Smaller image size, faster build times, reduced attack surface.                |
| **Configuration**          | Parameterized with environment variables and Kubernetes Secrets. web-frontend uses `envsubst` for runtime configuration.                   | Separation of configuration from code, enhanced security for sensitive values. |
| **Terraform**              | Refactored into reusable modules (`database`, `redis`, `s3`, `networking`, `security`, `kubernetes`) with S3 backend and DynamoDB locking. | Improved code organization, reusability, and state management integrity.       |
| **CI Scripts**             | Added `terraform-ci.yml` to validate Terraform code (`fmt`, `plan`).                                                                       | Early detection of configuration errors and style issues.                      |
| **Kubernetes Deployments** | Added `strategy: RollingUpdate` to both `web-frontend-deployment.yaml` and `backend-deployment.yaml`.                                      | Zero-downtime deployments and safer rollouts.                                  |
| **Health Checks**          | Liveness and Readiness probes are configured in both deployments, leveraging the health check endpoints defined in the Dockerfiles.        | Improved service reliability and traffic routing.                              |

---
