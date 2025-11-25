# Helm Charts

This directory contains Helm charts for deploying Flowlet services to Kubernetes.

## Structure

- `flowlet/` - Main Helm chart for the entire platform
  - `Chart.yaml` - Chart metadata
  - `values.yaml` - Default configuration values
  - `templates/` - Kubernetes manifest templates
  - `values/` - Environment-specific values
    - `development.yaml`
    - `staging.yaml`
    - `production.yaml`

## Usage

```bash
# Update dependencies
helm dependency update flowlet

# Install chart
helm install flowlet ./flowlet --namespace flowlet --create-namespace

# Upgrade existing installation
helm upgrade flowlet ./flowlet --namespace flowlet -f values/production.yaml
```
