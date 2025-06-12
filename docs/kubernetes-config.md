# Flowlet Kubernetes Configuration Guide

This guide provides an overview of the Kubernetes configurations used in the Flowlet project, including manifest files, Helm charts, and secrets management.

## Project Structure

The Kubernetes configurations are organized into the following directories:

- `kubernetes/manifests/`: Contains raw Kubernetes YAML manifest files for deploying core services.
- `kubernetes/helm/`: Contains Helm charts for packaging and deploying applications.
- `kubernetes/secrets/`: Manages Kubernetes secrets for sensitive information.
- `kubernetes/jobs/`: Defines Kubernetes Jobs for one-off tasks or batch processing.
- `kubernetes/config/`: Configuration files for various Kubernetes components or integrations.

## Manifests

The `kubernetes/manifests/` directory contains the following key manifest files:

- `backend-deployment.yaml`: Defines the deployment for the Flowlet backend service.
- `backend-service.yaml`: Defines the Kubernetes Service for the Flowlet backend.
- `frontend-deployment.yaml`: Defines the deployment for the Flowlet web frontend.
- `frontend-service.yaml`: Defines the Kubernetes Service for the Flowlet web frontend.
- `ingress.yaml`: Configures Ingress resources for external access to the services.

To deploy these manifests, you can use `kubectl`:

```bash
kubectl apply -f kubernetes/manifests/backend-deployment.yaml
kubectl apply -f kubernetes/manifests/backend-service.yaml
# ... and so on for other manifests
```

## Helm Charts

The `kubernetes/helm/flowlet-chart/` directory contains the Helm chart for deploying the entire Flowlet application. Helm simplifies the deployment and management of complex Kubernetes applications.

### Chart Structure

- `Chart.yaml`: Defines the chart metadata (name, version, description).
- `values.yaml`: Contains default configuration values that can be overridden during deployment.
- `templates/`: Contains Kubernetes manifest templates, which are rendered using the values from `values.yaml`.
  - `deployment.yaml`: Template for application deployments.
  - `service.yaml`: Template for Kubernetes Services.
  - `ingress.yaml`: Template for Ingress resources.
  - `_helpers.tpl`: Helper templates for common logic.
  - `NOTES.txt`: Instructions displayed after a successful Helm release.

### Deploying with Helm

To deploy Flowlet using Helm, navigate to the `Flowlet/kubernetes/helm/` directory and run:

```bash
helm install flowlet-release ./flowlet-chart -f values.yaml
```

You can override values in `values.yaml` using the `--set` flag or by providing a custom values file:

```bash
helm install flowlet-release ./flowlet-chart --set backend.replicaCount=3
helm install flowlet-release ./flowlet-chart -f my-custom-values.yaml
```

### Upgrading with Helm

To upgrade an existing Helm release:

```bash
helm upgrade flowlet-release ./flowlet-chart
```

### Uninstalling with Helm

To uninstall a Helm release:

```bash
helm uninstall flowlet-release
```

## Secrets Management

The `kubernetes/secrets/` directory contains examples or templates for managing sensitive information in Kubernetes. It is crucial to handle secrets securely.

- `flowlet-secrets.yaml`: An example of how to define secrets. **Do not commit actual sensitive data to version control.**

Best practices for managing secrets:

- Use Kubernetes Secrets to store sensitive data (e.g., database passwords, API keys).
- Encrypt secrets at rest using solutions like `sops` or cloud provider KMS.
- Use tools like `Vault` for dynamic secret generation and rotation.
- Restrict access to secrets using Kubernetes RBAC.

## Jobs

The `kubernetes/jobs/` directory can contain definitions for Kubernetes Jobs, which are used for running one-off tasks to completion. Examples include database migrations, data processing, or batch operations.

## Configuration

The `kubernetes/config/` directory can hold various configuration files related to Kubernetes, such as `integrations/` for third-party service integrations.

## Infrastructure Kubernetes

Note that there is also a `Flowlet/infrastructure/kubernetes/` directory which contains more detailed and extensive Kubernetes configurations for various infrastructure components like databases, messaging systems, monitoring, and security. This guide focuses on the application-level Kubernetes configurations within `Flowlet/kubernetes/`.

For detailed infrastructure-level Kubernetes configurations, refer to the [Infrastructure Guide](infrastructure/docs/infrastructure-guide.md).


