# Kubernetes Secrets

This directory contains Kubernetes Secret manifests for the Flowlet platform.

## Contents

- `flowlet-secrets.yaml` - Template for platform-wide secrets
- `database-credentials.yaml` - Database access credentials
- `api-keys.yaml` - External API integration keys
- `encryption-keys.yaml` - Data encryption keys
- `jwt-keys.yaml` - JWT signing keys

## Usage

These secret templates are applied to the Kubernetes cluster using:

```bash
kubectl apply -f secrets/
```

## Security Best Practices

- All secrets are encrypted at rest in etcd
- Access to secrets is restricted by RBAC
- Secrets are rotated regularly
- These templates do not contain actual secret values, only placeholders
- Actual secret values are injected during deployment via a secure process
