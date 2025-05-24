# Kubernetes Configuration Files

This directory contains configuration files for Flowlet services deployed on Kubernetes.

## Contents

- `database.yaml` - Database configuration
- `redis.yaml` - Redis configuration
- `kafka.yaml` - Kafka configuration
- `services/` - Service-specific configurations
  - `wallet.yaml`
  - `payments.yaml`
  - `cards.yaml`
  - `kyc.yaml`
  - `ledger.yaml`

## Usage

These configuration files are applied to the Kubernetes cluster using:

```bash
kubectl apply -f config/
```

## Best Practices

- Configurations are environment-agnostic
- Sensitive values are referenced from secrets
- Resource limits are defined for all components
- Health checks are configured for all services
