# Flowlet Operational Scripts: Comprehensive Documentation

This document provides a comprehensive and structured overview of the operational scripts utilized within the Flowlet project. These scripts are essential for managing the application's lifecycle, including setup, deployment, monitoring, and maintenance. The design of these scripts emphasizes **automation, consistency, and operational integrity**, which are critical requirements for a financial technology platform.

The scripts are organized into a consolidated structure, with the main logic centralized in top-level scripts for ease of use and maintenance.

## 1. Scripts Overview

The following table provides a quick reference for all executable scripts and their primary function.

| Script                     | Path                               | Category         | Description                                                                                                                    |
| :------------------------- | :--------------------------------- | :--------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `setup.sh`                 | `scripts/setup.sh`                 | **Setup**        | Unified script for initial environment setup (local development or production Kubernetes prerequisites).                       |
| `deployment/deploy.sh`     | `scripts/deployment/deploy.sh`     | **Deployment**   | Automates the deployment of the Flowlet application to a Kubernetes cluster using Helm.                                        |
| `monitoring/monitoring.sh` | `scripts/monitoring/monitoring.sh` | **Monitoring**   | Manages the installation of the full observability stack (Prometheus, Loki, Jaeger) and checks application status.             |
| `backup/backup.sh`         | `scripts/backup/backup.sh`         | **Maintenance**  | Executes secure, compressed backups for PostgreSQL or MySQL databases.                                                         |
| `lint.sh`                  | `scripts/lint.sh`                  | **Code Quality** | Runs a comprehensive suite of linters and formatters for both Python (backend) and JavaScript/TypeScript (frontend) codebases. |
| `start.sh`                 | `scripts/start.sh`                 | **Development**  | Starts the local development environment (backend and frontend servers).                                                       |
| `stop.sh`                  | `scripts/stop.sh`                  | **Development**  | Gracefully stops the running local development servers.                                                                        |

## 2. Detailed Script Documentation

### 2.1. `setup.sh` - Unified Environment Setup

This script is the entry point for configuring the Flowlet environment. It supports two primary modes: setting up a local development environment or preparing the necessary tools for a production Kubernetes deployment.

| Parameter     | Value         | Description                                                            | Action Performed                                                                                                                        |
| :------------ | :------------ | :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`       | `development` | Sets up a complete local development environment.                      | Installs Python/Node dependencies, creates `.env.local`, sets up a local database, and generates the `dev-start.sh` script.             |
| `--env`       | `production`  | Prepares the system for production deployment.                         | Checks for `kubectl` and `helm`, creates the Kubernetes namespace, sets up configuration secrets, and deploys the application via Helm. |
| `--namespace` | `<name>`      | (Optional, Production only) Specifies the target Kubernetes namespace. | Defaults to `flowlet-prod` or `flowlet-staging` based on the environment.                                                               |

**Usage Examples:**

```bash
# Setup a local development environment
./setup.sh --env development

# Setup a production environment in Kubernetes
./setup.sh --env production --namespace flowlet-prod
```

### 2.2. `deployment/deploy.sh` - Application Deployment

The deployment script orchestrates the application rollout to a Kubernetes cluster, ensuring consistency and auditability. It leverages Helm for managing releases and `kubectl` for applying necessary manifests.

| Parameter     | Value                     | Default                             | Description                                                                                  |
| :------------ | :------------------------ | :---------------------------------- | :------------------------------------------------------------------------------------------- |
| `--env`       | `staging` or `production` | `staging`                           | The target environment for the deployment. This selects the appropriate Helm values file.    |
| `--namespace` | `<name>`                  | `flowlet-staging` or `flowlet-prod` | The Kubernetes namespace to deploy into. Automatically set based on `--env` if not provided. |

**Deployment Steps:**

1.  **Prerequisite Check**: Verifies the presence of `kubectl` and `helm`.
2.  **Namespace Management**: Ensures the target Kubernetes namespace exists.
3.  **Manifest Application**: Applies general Kubernetes manifests (e.g., ConfigMaps, Secrets, PVs) from `kubernetes/manifests`.
4.  **Helm Deployment**: Executes `helm upgrade --install` using the `flowlet-chart` and environment-specific values.
5.  **Rollout Verification**: Waits for the backend and frontend deployments to successfully roll out.

**Usage Example:**

```bash
# Deploy to the production environment
./deployment/deploy.sh --env production
```

### 2.3. `monitoring/monitoring.sh` - Observability Stack Management

This script provides a unified interface for installing and checking the status of the Flowlet observability stack, which is crucial for maintaining system availability and performance in a financial context.

| Command  | Parameter                | Default      | Description                                                                                                                |
| :------- | :----------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------- |
| `setup`  | `--mon-namespace <name>` | `monitoring` | Installs the full monitoring stack: **Prometheus** (metrics), **Loki** (logs), and **Jaeger** (tracing) using Helm charts. |
| `status` | `--app-namespace <name>` | `flowlet`    | Displays the current status of the Flowlet application pods and the monitoring stack pods.                                 |

**Installed Components:**

| Component   | Purpose                                                   | Technology                           |
| :---------- | :-------------------------------------------------------- | :----------------------------------- |
| **Metrics** | Time-series data collection and alerting.                 | Prometheus (`kube-prometheus-stack`) |
| **Logging** | Centralized log aggregation and querying.                 | Loki (`loki-stack`)                  |
| **Tracing** | Distributed transaction tracing for performance analysis. | Jaeger Operator                      |

**Usage Examples:**

```bash
# Install the monitoring stack
./monitoring/monitoring.sh setup

# Check the status of the application and monitoring components
./monitoring/monitoring.sh status --app-namespace flowlet-prod
```

### 2.4. `backup/backup.sh` - Data Backup

This script is designed for the secure and automated backup of the application's relational database. It ensures data integrity and supports disaster recovery planning.

| Parameter   | Value      | Description                                      | Backup Tool Used |
| :---------- | :--------- | :----------------------------------------------- | :--------------- |
| `--db-type` | `postgres` | Executes a backup using the `pg_dump` utility.   | `pg_dump`        |
| `--db-type` | `mysql`    | Executes a backup using the `mysqldump` utility. | `mysqldump`      |

The script automatically creates a timestamped backup file, which is then compressed using `gzip` for efficient storage and secure transfer.

**Usage Example:**

```bash
# Backup the PostgreSQL database
./backup/backup.sh --db-type postgres

# Backup the MySQL database
./backup/backup.sh --db-type mysql
```

### 2.5. `lint.sh` - Code Quality and Security

The `lint.sh` script enforces code quality, style consistency, and security standards across the entire codebase. It automatically installs necessary tools and reports any violations.

| Linter/Formatter | Target Language       | Purpose                          | Fix Command Hint             |
| :--------------- | :-------------------- | :------------------------------- | :--------------------------- |
| **Flake8**       | Python                | Code style and quality checks.   | N/A                          |
| **Black**        | Python                | Uncompromising code formatting.  | `black <path>`               |
| **isort**        | Python                | Import sorting and organization. | `isort <path>`               |
| **Bandit**       | Python                | Security vulnerability scanning. | N/A (Requires manual review) |
| **ESLint**       | JavaScript/TypeScript | Code quality and bug prevention. | `eslint --fix <path>`        |
| **Prettier**     | JavaScript/TypeScript | Opinionated code formatting.     | `prettier --write <path>`    |

**Usage Example:**

```bash
# Run the full linting suite
./lint.sh
```

### 2.6. Development Lifecycle Scripts

These simple wrapper scripts manage the local development server lifecycle.

| Script     | Functionality                                                                                                        |
| :--------- | :------------------------------------------------------------------------------------------------------------------- |
| `start.sh` | Executes the `dev-start.sh` script (generated by `setup.sh`) to start the backend and frontend servers concurrently. |
| `stop.sh`  | Gracefully stops the processes started by `start.sh`, ensuring a clean shutdown of the local environment.            |

**Usage:**

```bash
# Start the development environment
./start.sh

# Stop the development environment
./stop.sh
```
