# Flowlet Infrastructure Docker Images

This directory contains Dockerfiles for all Flowlet microservices.

## Core Services

### Wallet Service
- **Image**: `flowlet/wallet-service:latest`
- **Port**: 3000
- **Dependencies**: PostgreSQL, Redis, Kafka

### Payments Service
- **Image**: `flowlet/payments-service:latest`
- **Port**: 3001
- **Dependencies**: PostgreSQL, Redis, Kafka

### Card Service
- **Image**: `flowlet/card-service:latest`
- **Port**: 3002
- **Dependencies**: PostgreSQL, Redis, Kafka

### KYC/AML Service
- **Image**: `flowlet/kyc-aml-service:latest`
- **Port**: 3003
- **Dependencies**: PostgreSQL, MongoDB, Redis, Kafka

### Ledger Service
- **Image**: `flowlet/ledger-service:latest`
- **Port**: 3004
- **Dependencies**: PostgreSQL, Redis, Kafka

### API Gateway
- **Image**: `flowlet/api-gateway:latest`
- **Port**: 8080
- **Dependencies**: Redis

### Developer Portal
- **Image**: `flowlet/developer-portal:latest`
- **Port**: 3005
- **Dependencies**: PostgreSQL, Redis

### Authentication Service
- **Image**: `flowlet/auth-service:latest`
- **Port**: 3006
- **Dependencies**: PostgreSQL, Redis

### Notification Service
- **Image**: `flowlet/notification-service:latest`
- **Port**: 3007
- **Dependencies**: PostgreSQL, Redis, Kafka, RabbitMQ

### AI Fraud Detection
- **Image**: `flowlet/ai-fraud-detection:latest`
- **Port**: 3008
- **Dependencies**: PostgreSQL, MongoDB, Redis, Kafka, InfluxDB

### AI Chatbot
- **Image**: `flowlet/ai-chatbot:latest`
- **Port**: 3009
- **Dependencies**: PostgreSQL, MongoDB, Redis

## Building Images

To build all Docker images:

```bash
./scripts/build-images.sh
```

To build a specific service:

```bash
docker build -t flowlet/wallet-service:latest ./docker/wallet-service/
```

## Image Registry

All images should be pushed to your container registry:

```bash
docker tag flowlet/wallet-service:latest your-registry.com/flowlet/wallet-service:latest
docker push your-registry.com/flowlet/wallet-service:latest
```

## Environment Variables

Each service requires specific environment variables. See individual Kubernetes manifests for complete configuration.
