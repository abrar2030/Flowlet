# Flowlet Infrastructure

This repository contains the complete Infrastructure as Code (IaC) setup for the Flowlet embedded finance platform. It defines a production-ready, scalable microservices architecture using modern DevOps tools.

## 1. Core Infrastructure Technologies

The infrastructure is defined using a cloud-agnostic approach, primarily leveraging Kubernetes for orchestration and Terraform for cloud resource provisioning.

| Category               | Technology               | Purpose                                                                 | Key Files/Directories    |
| :--------------------- | :----------------------- | :---------------------------------------------------------------------- | :----------------------- |
| **Orchestration**      | **Kubernetes**           | Container deployment, scaling, and management.                          | `kubernetes/`            |
| **IaC**                | **Terraform**            | Provisioning and managing cloud resources (e.g., VPC, EKS/GKE cluster). | `terraform/`             |
| **Containerization**   | **Docker**               | Defining and building application images.                               | `docker/`                |
| **Package Management** | **Helm**                 | Simplifying the deployment and management of Kubernetes applications.   | `helm/`                  |
| **CI/CD**              | **GitHub Actions**       | Automated build, test, and deployment pipelines.                        | `ci-cd/`                 |
| **Monitoring**         | **Prometheus & Grafana** | Metrics collection, alerting, and visualization.                        | `kubernetes/monitoring/` |

## 2. Directory Structure

The repository is organized into logical directories, each focusing on a specific aspect of the infrastructure lifecycle.

| Directory       | Primary Function                                                       | Key Contents                                                                                     |
| :-------------- | :--------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **terraform/**  | Infrastructure as Code for cloud resource provisioning.                | `main.tf`, `variables.tf`, `outputs.tf`, `modules/` (reusable components).                       |
| **kubernetes/** | Kubernetes manifests for deploying the application.                    | Sub-directories for `namespaces/`, `services/`, `databases/`, `monitoring/`, and `security/`.    |
| **docker/**     | Dockerfiles and related configuration for building service images.     | `Dockerfile.backend`, `Dockerfile.web-frontend`, `docker-compose.yml` (for local dev).           |
| **helm/**       | Helm charts for packaging and deploying the application to Kubernetes. | `flowlet/` (the main application chart).                                                         |
| **ci-cd/**      | Continuous Integration and Continuous Deployment pipelines.            | YAML files defining GitHub Actions workflows for various services and infrastructure components. |
| **scripts/**    | Utility scripts for deployment, building, and maintenance tasks.       | `deploy.sh`, `build-images.sh`, `cleanup.sh`, `validate.sh`.                                     |
| **docs/**       | Infrastructure-specific documentation and diagrams.                    | Runbooks, architecture diagrams, and setup guides.                                               |
| `README.md`     | This documentation file.                                               | Overview and quick start guide.                                                                  |

## 3. Kubernetes Deployment Structure

The `kubernetes/` directory is structured to manage the deployment of the entire microservices ecosystem.

| Sub-Directory   | Purpose                                           | Key Components Deployed                                                   |
| :-------------- | :------------------------------------------------ | :------------------------------------------------------------------------ |
| **namespaces/** | Defines logical isolation boundaries.             | `flowlet-core`, `flowlet-monitoring`, etc.                                |
| **databases/**  | Manifests for stateful data services.             | PostgreSQL, MongoDB, Redis.                                               |
| **messaging/**  | Manifests for inter-service communication.        | Kafka, RabbitMQ.                                                          |
| **services/**   | Manifests for the core application microservices. | Wallet, Payments, Card, KYC/AML, Ledger, Auth, Notification, AI Services. |
| **ingress/**    | Defines external access and routing.              | Ingress controllers, Ingress resources, and network policies.             |
| **monitoring/** | Defines observability stack components.           | Prometheus, Grafana, Alertmanager.                                        |
| **security/**   | Defines security-related resources.               | Network policies, Secrets, ConfigMaps for security configurations.        |

## 4. CI/CD Pipelines (GitHub Actions)

The `ci-cd/` directory contains workflows to automate the software delivery process.

| Workflow File                   | Trigger                            | Purpose                                                                 |
| :------------------------------ | :--------------------------------- | :---------------------------------------------------------------------- |
| `python-backend-ci-cd.yml`      | Push to `main` (or feature branch) | Builds, tests, and deploys the Python backend service.                  |
| `nodejs-web-frontend-ci-cd.yml` | Push to `main` (or feature branch) | Builds, tests, and deploys the Node.js web-frontend application.        |
| `terraform-ci.yml`              | Changes in `terraform/`            | Runs `terraform plan` and `terraform apply` for infrastructure changes. |
| `kubernetes-ci.yml`             | Changes in `kubernetes/`           | Validates Kubernetes manifests and applies changes to the cluster.      |
| `documentation.yml`             | Scheduled or Manual                | Generates and updates documentation (e.g., API specs, runbooks).        |
| `scripts-ci.yml`                | Changes in `scripts/`              | Runs linting and validation checks on utility scripts.                  |

## 5. Quick Start: Deployment

The `scripts/` directory provides convenient wrappers for common operational tasks.

| Script            | Description                                                                               | Usage Example                            |
| :---------------- | :---------------------------------------------------------------------------------------- | :--------------------------------------- |
| `deploy.sh`       | Main deployment script that orchestrates the entire application deployment to Kubernetes. | `./scripts/deploy.sh --env=staging`      |
| `build-images.sh` | Builds all necessary Docker images for the application services.                          | `./scripts/build-images.sh --tag=v1.2.0` |
| `cleanup.sh`      | Removes all deployed Kubernetes resources and cleans up local artifacts.                  | `./scripts/cleanup.sh --force`           |
| `validate.sh`     | Runs linting and validation checks on all IaC files (Terraform, Kubernetes, Docker).      | `./scripts/validate.sh`                  |

### Deployment Steps

1.  **Configure Environment**: Ensure your cloud provider credentials and `kubectl` context are correctly set.
2.  **Provision Infrastructure**: Run Terraform to provision the underlying cloud resources (e.g., EKS cluster).
    ```bash
    cd terraform
    terraform init
    terraform apply
    ```
3.  **Deploy Application**: Use the main deployment script to push the application to the cluster.
    ```bash
    cd ..
    ./scripts/deploy.sh
    ```
