# Flowlet Infrastructure

This directory contains all infrastructure-as-code (IaC) for the Flowlet embedded finance platform.

## Directory Structure

```
infrastructure/
├── README.md                 # This file
├── terraform/                # Terraform configurations for cloud resources
├── kubernetes/               # Kubernetes manifests and Helm charts
├── ansible/                  # Ansible playbooks for configuration management
├── ci-cd/                    # CI/CD pipeline definitions
├── docker/                   # Docker Compose for local development
├── scripts/                  # Utility scripts for deployment and validation
└── validation_logs/          # Validation output logs
```

## Prerequisites

### Required Tools

| Tool           | Minimum Version | Installation                                                |
| -------------- | --------------- | ----------------------------------------------------------- |
| Terraform      | 1.0+            | https://www.terraform.io/downloads                          |
| kubectl        | 1.28+           | https://kubernetes.io/docs/tasks/tools/                     |
| Helm           | 3.12+           | https://helm.sh/docs/intro/install/                         |
| Ansible        | 2.15+           | https://docs.ansible.com/ansible/latest/installation_guide/ |
| Docker         | 24.0+           | https://docs.docker.com/get-docker/                         |
| Docker Compose | 2.20+           | https://docs.docker.com/compose/install/                    |
| yamllint       | 1.32+           | `pip install yamllint`                                      |
| kubeval        | 0.16+           | https://github.com/instrumenta/kubeval                      |
| tflint         | 0.47+           | https://github.com/terraform-linters/tflint                 |
| tfsec          | 1.28+           | https://github.com/aquasecurity/tfsec                       |
| ansible-lint   | 6.17+           | `pip install ansible-lint`                                  |

### AWS Credentials (for Terraform)

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-west-2"
```

## Quick Start - Local Development

### 1. Environment Setup

Copy the example environment file and configure your secrets:

```bash
# For Docker Compose
cp docker/.env.example docker/.env
# Edit docker/.env with your actual values

# For Kubernetes
cp kubernetes/secrets/secret.example.yaml kubernetes/secrets/secret.yaml
# Edit kubernetes/secrets/secret.yaml with base64-encoded values
```

### 2. Start Local Environment (Docker Compose)

```bash
cd docker
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend

# Stop services
docker compose down
```

**Services Access:**

- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090

## Terraform Usage

### Local Backend (Development)

For local development and testing without AWS:

```bash
cd terraform

# Initialize with local backend
terraform init

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Plan with example variables (dry-run)
terraform plan -var-file=terraform.tfvars.example
```

### Remote Backend (Production)

For production deployments with state stored in S3:

1. Create S3 bucket and DynamoDB table for state management
2. Configure backend in `terraform/backend.tf`
3. Initialize and deploy:

```bash
cd terraform

# Initialize with remote backend
terraform init

# Plan deployment
terraform plan -var-file=terraform.tfvars

# Apply changes
terraform apply -var-file=terraform.tfvars
```

## Kubernetes Usage

### Validation

```bash
cd kubernetes

# Lint YAML files
yamllint -c ../.yamllint.yaml .

# Validate manifests against Kubernetes schema
kubeval --strict manifests/*.yaml

# Dry-run apply
kubectl apply --dry-run=client -f manifests/
```

### Deployment

```bash
cd kubernetes

# Create namespaces
kubectl apply -f namespaces/

# Create secrets (after configuring secret.yaml)
kubectl apply -f secrets/

# Deploy databases
kubectl apply -f databases/

# Deploy services
kubectl apply -f services/

# Deploy ingress
kubectl apply -f ingress/

# Check deployment status
kubectl get all -n flowlet-services
```

## Ansible Usage

### Configuration

```bash
cd ansible

# Copy inventory example
cp inventory.example inventory

# Edit inventory with your target hosts
vim inventory
```

### Running Playbooks

```bash
cd ansible

# Dry-run (check mode)
ansible-playbook -i inventory site.yml --check

# Execute playbook
ansible-playbook -i inventory site.yml

# Run specific role
ansible-playbook -i inventory site.yml --tags "docker"
```

## CI/CD Pipelines

The `ci-cd/` directory contains GitHub Actions workflows for:

- `terraform-ci.yml` - Terraform validation and planning
- `kubernetes-ci.yml` - Kubernetes manifest validation
- `python-backend-ci-cd.yml` - Backend service CI/CD
- `nodejs-frontend-ci-cd.yml` - Frontend application CI/CD

### Required GitHub Secrets

Configure these in your GitHub repository settings:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
KUBECONFIG_DATA
```

## Validation & Testing

Run all validation checks:

```bash
cd scripts
./validate.sh
```

This script performs:

- Terraform formatting and validation
- Kubernetes manifest linting and schema validation
- Ansible playbook linting
- CI/CD workflow YAML validation

View validation logs in `validation_logs/` directory.

## Security Best Practices

### Secrets Management

1. **Never commit secrets** to version control
2. Use `.example` files as templates
3. Store production secrets in:
   - AWS Secrets Manager (Terraform)
   - Kubernetes Secrets (Base64 encoded)
   - Environment variables (Docker Compose)
4. Use strong, randomly generated passwords
5. Rotate secrets regularly

### Generating Secrets

```bash
# Generate random password
openssl rand -base64 32

# Base64 encode for Kubernetes
echo -n "your-secret-value" | base64

# Base64 decode to verify
echo "base64-string" | base64 -d
```

## Troubleshooting

### Terraform Issues

```bash
# Clean up and re-initialize
rm -rf .terraform .terraform.lock.hcl
terraform init

# Debug with detailed logging
TF_LOG=DEBUG terraform plan
```

### Kubernetes Issues

```bash
# Check pod logs
kubectl logs -n flowlet-services <pod-name>

# Describe pod for events
kubectl describe pod -n flowlet-services <pod-name>

# Check secrets
kubectl get secrets -n flowlet-services
kubectl describe secret flowlet-secrets -n flowlet-services
```

### Docker Compose Issues

```bash
# Rebuild images
docker compose build --no-cache

# Remove volumes and restart
docker compose down -v
docker compose up -d
```

## Infrastructure Costs (AWS)

Estimated monthly costs for different environments:

| Environment | Compute | Database | Storage | Total  |
| ----------- | ------- | -------- | ------- | ------ |
| Development | $50     | $30      | $10     | ~$90   |
| Staging     | $150    | $100     | $30     | ~$280  |
| Production  | $500    | $400     | $100    | ~$1000 |

_Costs vary based on usage, data transfer, and regional pricing_

## Support & Contributing

- Report issues: https://github.com/abrar2030/Flowlet/issues
- Documentation: https://github.com/abrar2030/Flowlet/tree/main/docs
- Contributing Guide: https://github.com/abrar2030/Flowlet/blob/main/CONTRIBUTING.md

## License

This infrastructure code is part of the Flowlet project and is licensed under the MIT License.
