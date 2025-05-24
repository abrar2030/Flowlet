# Kubernetes Jobs

This directory contains Kubernetes Job manifests for the Flowlet platform.

## Contents

- `init-system.yaml` - System initialization job
- `database-migration.yaml` - Database schema migration job
- `data-seeding.yaml` - Initial data seeding job
- `backup.yaml` - Database backup job
- `cleanup.yaml` - System cleanup job

## Usage

These job manifests are applied to the Kubernetes cluster using:

```bash
kubectl apply -f jobs/init-system.yaml
kubectl wait --for=condition=complete job/flowlet-init -n flowlet
```

## Best Practices

- Jobs include appropriate resource limits
- Retry policies are configured for transient failures
- Jobs use dedicated service accounts with minimal permissions
- Completion and failure are properly handled
- Job history is managed with appropriate TTL settings
