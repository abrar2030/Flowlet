# Flowlet Infrastructure Documentation

## Overview

This document provides comprehensive information about the Flowlet embedded finance platform infrastructure, including deployment procedures, configuration options, and operational guidelines.

## Architecture

### Microservices Architecture

Flowlet follows a domain-driven microservices architecture with clear service boundaries:

#### Core Financial Services

- **Wallet Service**: Manages digital wallets, balances, and account operations
- **Payments Service**: Handles payment processing, transfers, and settlement
- **Card Service**: Manages card issuance, controls, and transaction processing
- **Ledger Service**: Maintains double-entry accounting and financial records
- **KYC/AML Service**: Handles identity verification and compliance workflows

#### Platform Services

- **API Gateway**: Provides unified API access, authentication, and rate limiting
- **Auth Service**: Manages user authentication, authorization, and session handling
- **Notification Service**: Handles multi-channel notifications (email, SMS, push)
- **Developer Portal**: Provides documentation, SDKs, and developer tools

#### AI Services

- **Fraud Detection**: ML-powered transaction monitoring and fraud prevention
- **AI Chatbot**: Intelligent customer support and developer assistance

### Data Architecture

#### Primary Databases

- **PostgreSQL**: ACID-compliant transactional data for core services
- **MongoDB**: Flexible document storage for analytics and unstructured data
- **Redis**: High-performance caching and session management
- **InfluxDB**: Time-series data for metrics, monitoring, and analytics

#### Messaging Systems

- **Apache Kafka**: Event streaming for service communication and event sourcing
- **RabbitMQ**: Message queuing for specific synchronous messaging needs

### Infrastructure Components

#### Container Orchestration

- **Kubernetes**: Container orchestration and service management
- **Docker**: Containerization of all services and dependencies
- **Helm**: Package management for complex Kubernetes deployments

#### Monitoring and Observability

- **Prometheus**: Metrics collection, alerting, and monitoring
- **Grafana**: Visualization, dashboards, and reporting
- **Jaeger**: Distributed tracing for performance analysis

#### Security

- **Istio Service Mesh**: Secure service-to-service communication
- **Cert-Manager**: Automated TLS certificate management
- **Vault**: Secrets management and encryption key storage

## Deployment Guide

### Prerequisites

#### System Requirements

- Kubernetes cluster (version 1.24 or higher)
- Minimum 16 CPU cores and 32GB RAM for production deployment
- 500GB+ storage for databases and persistent volumes
- Load balancer support for external access

#### Required Tools

- `kubectl` - Kubernetes command-line tool
- `helm` - Kubernetes package manager
- `terraform` - Infrastructure as Code tool (optional)
- `docker` - Container runtime for building images

### Step-by-Step Deployment

#### 1. Cluster Preparation

```bash
# Verify cluster access
kubectl cluster-info

# Create necessary storage classes (if not available)
kubectl apply -f kubernetes/storage/storage-classes.yaml

# Install cert-manager for TLS
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### 2. Infrastructure Deployment

```bash
# Deploy using the automated script
./scripts/deploy.sh

# Or deploy manually step by step
kubectl apply -f kubernetes/namespaces/
kubectl apply -f kubernetes/databases/
kubectl apply -f kubernetes/messaging/
kubectl apply -f kubernetes/services/
kubectl apply -f kubernetes/monitoring/
kubectl apply -f kubernetes/security/
kubectl apply -f kubernetes/ingress/
```

#### 3. Configuration

```bash
# Update database passwords
kubectl create secret generic postgres-credentials \
  --from-literal=username=flowlet \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  --from-literal=database=flowlet \
  -n flowlet-data

# Configure API keys for external services
kubectl create secret generic flowlet-api-keys \
  --from-literal=stripe-api-key=YOUR_STRIPE_KEY \
  --from-literal=sendgrid-api-key=YOUR_SENDGRID_KEY \
  -n flowlet-security
```

#### 4. Verification

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Verify services are accessible
kubectl get svc -n flowlet-core
kubectl get svc -n flowlet-monitoring

# Test API Gateway health
kubectl port-forward svc/api-gateway 8080:80 -n flowlet-core
curl http://localhost:8080/health
```

## Configuration

### Environment Variables

#### Database Configuration

```yaml
database:
  host: postgresql.flowlet-data.svc.cluster.local
  port: 5432
  name: flowlet
  username: flowlet
  password: ${DB_PASSWORD}
  ssl: true
  pool:
    min: 5
    max: 20
```

#### Redis Configuration

```yaml
redis:
  host: redis.flowlet-data.svc.cluster.local
  port: 6379
  password: ${REDIS_PASSWORD}
  db: 0
  maxRetries: 3
  retryDelayOnFailover: 100
```

#### Kafka Configuration

```yaml
kafka:
  brokers:
    - kafka-0.kafka.flowlet-messaging.svc.cluster.local:9092
    - kafka-1.kafka.flowlet-messaging.svc.cluster.local:9092
    - kafka-2.kafka.flowlet-messaging.svc.cluster.local:9092
  topics:
    transactions: flowlet.transactions
    notifications: flowlet.notifications
    audit: flowlet.audit
```

### Service Configuration

#### API Gateway

```yaml
services:
  wallet:
    url: http://wallet-service.flowlet-core.svc.cluster.local
    timeout: 30s
    retries: 3
  payments:
    url: http://payments-service.flowlet-core.svc.cluster.local
    timeout: 60s
    retries: 2
rateLimit:
  global: 10000/hour
  perUser: 1000/hour
  perIP: 100/minute
```

#### Authentication Service

```yaml
jwt:
  secret: ${JWT_SECRET}
  expiresIn: 24h
  algorithm: HS256
oauth:
  google:
    clientId: ${GOOGLE_CLIENT_ID}
    clientSecret: ${GOOGLE_CLIENT_SECRET}
  github:
    clientId: ${GITHUB_CLIENT_ID}
    clientSecret: ${GITHUB_CLIENT_SECRET}
```

### Security Configuration

#### TLS Configuration

```yaml
tls:
  enabled: true
  minVersion: "1.2"
  cipherSuites:
    - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
    - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
```

#### Network Policies

```yaml
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: flowlet-core
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: flowlet-data
```

## Operations

### Monitoring

#### Prometheus Metrics

Key metrics to monitor:

```promql
# Service availability
up{job="flowlet-services"}

# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database connections
database_connections_active
database_connections_idle
```

#### Grafana Dashboards

Pre-configured dashboards include:

1. **Platform Overview**: High-level system health and performance
2. **Service Details**: Individual service metrics and logs
3. **Database Performance**: Query performance and connection pools
4. **Infrastructure**: Kubernetes cluster and node metrics
5. **Security**: Authentication events and security incidents

#### Alerting Rules

Critical alerts configured:

```yaml
groups:
  - name: flowlet.critical
    rules:
      - alert: ServiceDown
        expr: up{job="flowlet-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.kubernetes_name }} is down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.kubernetes_name }}"
```

### Scaling

#### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wallet-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wallet-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

#### Database Scaling

##### PostgreSQL Read Replicas

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgresql-cluster
spec:
  instances: 3
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
  monitoring:
    enabled: true
```

##### Redis Cluster

```yaml
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: redis-cluster
spec:
  clusterSize: 6
  redisExporter:
    enabled: true
  storage:
    volumeClaimTemplate:
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

### Backup and Recovery

#### Database Backups

```bash
# PostgreSQL backup
kubectl exec -n flowlet-data postgresql-0 -- pg_dump -U flowlet flowlet > backup.sql

# MongoDB backup
kubectl exec -n flowlet-data mongodb-0 -- mongodump --db flowlet --out /tmp/backup

# Redis backup
kubectl exec -n flowlet-data redis-0 -- redis-cli BGSAVE
```

#### Disaster Recovery

```bash
# Create cluster backup
velero backup create flowlet-backup --include-namespaces flowlet-core,flowlet-data,flowlet-messaging

# Restore from backup
velero restore create --from-backup flowlet-backup
```

### Security Operations

#### Certificate Management

```bash
# Check certificate status
kubectl get certificates -A

# Renew certificates
kubectl annotate certificate flowlet-tls cert-manager.io/issue-temporary-certificate="true"
```

#### Secret Rotation

```bash
# Rotate database passwords
kubectl create secret generic postgres-credentials-new \
  --from-literal=password=NEW_PASSWORD \
  -n flowlet-data

# Update deployments to use new secret
kubectl patch deployment wallet-service -n flowlet-core \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"wallet-service","env":[{"name":"DB_PASSWORD","valueFrom":{"secretKeyRef":{"name":"postgres-credentials-new","key":"password"}}}]}]}}}}'
```

## Troubleshooting

### Common Issues

#### Service Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace> --previous

# Check events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl exec -it <service-pod> -n flowlet-core -- nc -zv postgresql.flowlet-data.svc.cluster.local 5432

# Check database logs
kubectl logs postgresql-0 -n flowlet-data

# Verify credentials
kubectl get secret postgres-credentials -n flowlet-data -o yaml
```

#### Performance Issues

```bash
# Check resource usage
kubectl top pods -n flowlet-core
kubectl top nodes

# Check HPA status
kubectl get hpa -n flowlet-core

# Review metrics in Grafana
kubectl port-forward svc/grafana 3000:3000 -n flowlet-monitoring
```

### Log Analysis

#### Centralized Logging

```bash
# View aggregated logs
kubectl logs -l app=wallet-service -n flowlet-core --tail=100

# Search for errors
kubectl logs -l app=payments-service -n flowlet-core | grep ERROR

# Follow real-time logs
kubectl logs -f deployment/api-gateway -n flowlet-core
```

#### Log Patterns

Common log patterns to monitor:

```
# Authentication failures
"authentication failed" OR "invalid token"

# Database errors
"connection refused" OR "timeout" OR "deadlock"

# Payment failures
"payment failed" OR "insufficient funds" OR "card declined"

# System errors
"out of memory" OR "disk full" OR "connection timeout"
```

## Performance Tuning

### Database Optimization

#### PostgreSQL Tuning

```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';

-- Query optimization
CREATE INDEX CONCURRENTLY idx_transactions_user_id ON transactions(user_id);
CREATE INDEX CONCURRENTLY idx_wallets_status ON wallets(status) WHERE status = 'active';
```

#### Redis Optimization

```redis
# Memory optimization
CONFIG SET maxmemory 512mb
CONFIG SET maxmemory-policy allkeys-lru

# Persistence tuning
CONFIG SET save "900 1 300 10 60 10000"
CONFIG SET appendonly yes
CONFIG SET appendfsync everysec
```

### Application Tuning

#### JVM Tuning (for Java services)

```yaml
env:
  - name: JAVA_OPTS
    value: "-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
```

#### Node.js Tuning

```yaml
env:
  - name: NODE_OPTIONS
    value: "--max-old-space-size=1024 --max-semi-space-size=128"
```

### Network Optimization

#### Service Mesh Configuration

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: wallet-service
spec:
  host: wallet-service.flowlet-core.svc.cluster.local
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 10
    circuitBreaker:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

## API Reference

### Authentication

All API requests require authentication via JWT tokens:

```bash
# Obtain token
curl -X POST https://api.flowlet.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in requests
curl -H "Authorization: Bearer <token>" \
  https://api.flowlet.com/wallets
```

### Core Endpoints

#### Wallet Management

```bash
# Create wallet
POST /wallets
{
  "userId": "user123",
  "currency": "USD",
  "type": "personal"
}

# Get wallet balance
GET /wallets/{walletId}/balance

# Get transaction history
GET /wallets/{walletId}/transactions?limit=50&offset=0
```

#### Payment Processing

```bash
# Create payment
POST /payments
{
  "fromWalletId": "wallet123",
  "toWalletId": "wallet456",
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment for services"
}

# Get payment status
GET /payments/{paymentId}
```

#### Card Management

```bash
# Issue card
POST /cards
{
  "walletId": "wallet123",
  "type": "virtual",
  "limits": {
    "daily": 1000.00,
    "monthly": 5000.00
  }
}

# Update card controls
PUT /cards/{cardId}/controls
{
  "enabled": true,
  "allowedMerchants": ["grocery", "gas"],
  "blockedCountries": ["XX"]
}
```

### Webhook Events

Flowlet sends webhook events for important platform events:

```json
{
  "id": "evt_123",
  "type": "payment.completed",
  "created": "2023-01-01T00:00:00Z",
  "data": {
    "paymentId": "pay_123",
    "amount": 100.0,
    "currency": "USD",
    "status": "completed"
  }
}
```

## SDK Documentation

### JavaScript/TypeScript SDK

```bash
npm install @flowlet/sdk
```

```typescript
import { FlowletClient } from "@flowlet/sdk";

const client = new FlowletClient({
  apiKey: "your-api-key",
  environment: "production", // or 'sandbox'
});

// Create a wallet
const wallet = await client.wallets.create({
  userId: "user123",
  currency: "USD",
});

// Process a payment
const payment = await client.payments.create({
  fromWalletId: wallet.id,
  toWalletId: "wallet456",
  amount: 100.0,
  currency: "USD",
});
```

### Python SDK

```bash
pip install flowlet-python
```

```python
import flowlet

client = flowlet.Client(
    api_key='your-api-key',
    environment='production'
)

# Create a wallet
wallet = client.wallets.create(
    user_id='user123',
    currency='USD'
)

# Process a payment
payment = client.payments.create(
    from_wallet_id=wallet.id,
    to_wallet_id='wallet456',
    amount=100.00,
    currency='USD'
)
```

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/flowlet/infrastructure.git
cd infrastructure

# Set up development environment
./scripts/dev-setup.sh

# Run tests
./scripts/test.sh

# Deploy to development cluster
./scripts/deploy-dev.sh
```
