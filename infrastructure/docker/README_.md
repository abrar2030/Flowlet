# Docker Configuration

This directory contains Docker-related files for containerizing Flowlet services.

## Contents

- `Dockerfile` - Multi-stage build configuration for services
- `docker-compose.yml` - Local development environment setup
- `.dockerignore` - Files to exclude from Docker builds

## Usage

```bash
# Build all services
docker-compose build

# Start local development environment
docker-compose up -d

# View logs
docker-compose logs -f
```

## Best Practices

- All services use multi-stage builds to minimize image size
- Base images are pinned to specific versions for reproducibility
- Non-root users are used for running applications
- Health checks are configured for all services
