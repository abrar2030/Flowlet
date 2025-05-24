# Kubernetes Manifests

This directory contains Kubernetes manifest files for the Flowlet platform.

## Contents

- `deployment/` - Deployment manifests for all services
- `service/` - Service manifests for internal and external communication
- `ingress.yaml` - Ingress configuration for external access
- `configmap/` - ConfigMap resources for non-sensitive configuration
- `hpa/` - Horizontal Pod Autoscaler configurations

## Usage

These manifests are applied to the Kubernetes cluster using:

```bash
kubectl apply -f manifests/
```

## Best Practices

- All resources include appropriate labels and annotations
- Resource limits and requests are defined for all components
- Health checks are configured for all services
- Pod disruption budgets are defined for critical services
- Network policies are configured to restrict traffic flow
