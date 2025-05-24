# Kubernetes Helm Charts

This directory contains Helm charts for deploying Flowlet services to Kubernetes clusters.

## Contents

- `flowlet/` - Main Helm chart for the Flowlet platform
  - `Chart.yaml` - Chart metadata
  - `values.yaml` - Default configuration values
  - `templates/` - Kubernetes manifest templates
  - `charts/` - Dependency charts

## Usage

```bash
# Update dependencies
helm dependency update ./flowlet

# Install the chart
helm install flowlet ./flowlet --namespace flowlet --create-namespace

# Upgrade existing installation
helm upgrade flowlet ./flowlet --namespace flowlet -f values/production.yaml
```

## Best Practices

- All configurable parameters are documented
- Sensible defaults are provided
- Resource limits and requests are defined for all components
- Health checks are configured for all services
