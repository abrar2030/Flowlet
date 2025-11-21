# Flowlet Infrastructure Testing Guide

## Overview

This document provides comprehensive testing procedures for the Flowlet infrastructure to ensure all components are properly configured and functional.

## Pre-Deployment Testing

### 1. Configuration Validation

```bash
# Run the validation script
./scripts/validate.sh

# Check for any errors or warnings
# All critical components should pass validation
```

### 2. YAML Syntax Validation

```bash
# Install yamllint (optional)
pip install yamllint

# Validate all YAML files
find kubernetes/ -name "*.yaml" -exec yamllint {} \;
```

### 3. Kubernetes Manifest Validation

```bash
# Dry-run validation (requires kubectl)
kubectl apply --dry-run=client -f kubernetes/namespaces/
kubectl apply --dry-run=client -f kubernetes/databases/
kubectl apply --dry-run=client -f kubernetes/messaging/
kubectl apply --dry-run=client -f kubernetes/services/
```

## Deployment Testing

### 1. Infrastructure Deployment

```bash
# Deploy the complete infrastructure
./scripts/deploy.sh

# Monitor deployment progress
watch kubectl get pods --all-namespaces
```

### 2. Component Health Checks

#### Database Health Checks

```bash
# PostgreSQL
kubectl exec -n flowlet-data postgresql-0 -- pg_isready -U flowlet

# MongoDB
kubectl exec -n flowlet-data mongodb-0 -- mongosh --eval "db.adminCommand('ping')"

# Redis
kubectl exec -n flowlet-data redis-0 -- redis-cli ping

# InfluxDB
kubectl exec -n flowlet-data influxdb-0 -- curl -f http://localhost:8086/ping
```

#### Messaging System Health Checks

```bash
# Kafka
kubectl exec -n flowlet-messaging kafka-0 -- kafka-broker-api-versions --bootstrap-server localhost:9092

# RabbitMQ
kubectl exec -n flowlet-messaging rabbitmq-0 -- rabbitmq-diagnostics status
```

#### Service Health Checks

```bash
# Check all services are running
kubectl get pods -n flowlet-core

# Test API Gateway health
kubectl port-forward -n flowlet-core svc/api-gateway 8080:80 &
curl http://localhost:8080/health
```

### 3. Connectivity Testing

#### Database Connectivity

```bash
# Test PostgreSQL connection from services
kubectl exec -n flowlet-core deployment/wallet-service -- nc -zv postgresql.flowlet-data.svc.cluster.local 5432

# Test MongoDB connection
kubectl exec -n flowlet-core deployment/kyc-aml-service -- nc -zv mongodb.flowlet-data.svc.cluster.local 27017

# Test Redis connection
kubectl exec -n flowlet-core deployment/wallet-service -- nc -zv redis.flowlet-data.svc.cluster.local 6379
```

#### Service-to-Service Connectivity

```bash
# Test API Gateway to services
kubectl exec -n flowlet-core deployment/api-gateway -- curl -f http://wallet-service/health
kubectl exec -n flowlet-core deployment/api-gateway -- curl -f http://payments-service/health
```

### 4. Load Balancer and Ingress Testing

```bash
# Check LoadBalancer services
kubectl get svc -n flowlet-core -o wide

# Test external access (if LoadBalancer is available)
API_GATEWAY_IP=$(kubectl get svc api-gateway -n flowlet-core -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$API_GATEWAY_IP/health

# Test ingress (if configured)
curl -H "Host: api.flowlet.com" http://your-ingress-ip/health
```

## Performance Testing

### 1. Resource Utilization

```bash
# Check CPU and memory usage
kubectl top nodes
kubectl top pods --all-namespaces

# Check resource requests and limits
kubectl describe nodes
```

### 2. Database Performance

```bash
# PostgreSQL performance test
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';"

# Redis performance test
kubectl exec -n flowlet-data redis-0 -- redis-cli --latency-history -i 1
```

### 3. Network Performance

```bash
# Test network latency between services
kubectl exec -n flowlet-core deployment/wallet-service -- ping -c 5 postgresql.flowlet-data.svc.cluster.local

# Test bandwidth
kubectl exec -n flowlet-core deployment/api-gateway -- curl -w "@curl-format.txt" -o /dev/null -s http://wallet-service/health
```

## Security Testing

### 1. Network Policy Validation

```bash
# Test that network policies are enforced
kubectl exec -n flowlet-core deployment/wallet-service -- nc -zv postgresql.flowlet-data.svc.cluster.local 5432
kubectl exec -n default deployment/test-pod -- nc -zv postgresql.flowlet-data.svc.cluster.local 5432  # Should fail
```

### 2. Secret Management

```bash
# Verify secrets are properly mounted
kubectl exec -n flowlet-core deployment/wallet-service -- env | grep -i password
kubectl exec -n flowlet-core deployment/wallet-service -- ls -la /var/run/secrets/
```

### 3. TLS Configuration

```bash
# Test TLS endpoints
kubectl exec -n flowlet-core deployment/api-gateway -- curl -k https://api.flowlet.com/health

# Check certificate validity
kubectl get certificates --all-namespaces
```

## Monitoring and Observability Testing

### 1. Prometheus Metrics

```bash
# Port-forward to Prometheus
kubectl port-forward -n flowlet-monitoring svc/prometheus 9090:9090 &

# Test metrics collection
curl http://localhost:9090/api/v1/query?query=up

# Check specific Flowlet metrics
curl "http://localhost:9090/api/v1/query?query=up{job='flowlet-services'}"
```

### 2. Grafana Dashboards

```bash
# Port-forward to Grafana
kubectl port-forward -n flowlet-monitoring svc/grafana 3000:3000 &

# Access Grafana (admin/admin123)
open http://localhost:3000

# Verify dashboards are loading data
```

### 3. Log Aggregation

```bash
# Check application logs
kubectl logs -n flowlet-core deployment/wallet-service --tail=100

# Check for error patterns
kubectl logs -n flowlet-core deployment/api-gateway | grep -i error

# Test log rotation and retention
kubectl exec -n flowlet-core deployment/wallet-service -- ls -la /var/log/
```

## Disaster Recovery Testing

### 1. Database Backup and Restore

```bash
# Test PostgreSQL backup
kubectl exec -n flowlet-data postgresql-0 -- pg_dump -U flowlet flowlet > test-backup.sql

# Test restore (in a test environment)
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet_test < test-backup.sql
```

### 2. Service Recovery

```bash
# Test pod recovery
kubectl delete pod -n flowlet-core -l app=wallet-service
kubectl wait --for=condition=Ready pod -l app=wallet-service -n flowlet-core --timeout=300s

# Test service discovery after recovery
kubectl exec -n flowlet-core deployment/api-gateway -- curl -f http://wallet-service/health
```

### 3. Data Persistence

```bash
# Test persistent volume claims
kubectl get pvc --all-namespaces

# Verify data survives pod restarts
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "CREATE TABLE test_persistence (id SERIAL, data TEXT);"
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "INSERT INTO test_persistence (data) VALUES ('test data');"
kubectl delete pod -n flowlet-data postgresql-0
kubectl wait --for=condition=Ready pod -l app=postgresql -n flowlet-data --timeout=300s
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "SELECT * FROM test_persistence;"
```

## Integration Testing

### 1. End-to-End API Testing

```bash
# Test complete API flow
API_GATEWAY_URL="http://localhost:8080"  # Adjust as needed

# 1. Authentication
AUTH_TOKEN=$(curl -s -X POST $API_GATEWAY_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' | jq -r '.token')

# 2. Create wallet
WALLET_ID=$(curl -s -X POST $API_GATEWAY_URL/wallets \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","currency":"USD"}' | jq -r '.id')

# 3. Check wallet balance
curl -s -X GET $API_GATEWAY_URL/wallets/$WALLET_ID/balance \
  -H "Authorization: Bearer $AUTH_TOKEN"

# 4. Create payment
curl -s -X POST $API_GATEWAY_URL/payments \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fromWalletId\":\"$WALLET_ID\",\"toWalletId\":\"wallet456\",\"amount\":100.00,\"currency\":\"USD\"}"
```

### 2. Event Flow Testing

```bash
# Test Kafka event production and consumption
kubectl exec -n flowlet-messaging kafka-0 -- kafka-console-producer --bootstrap-server localhost:9092 --topic flowlet.transactions
# Type test message and press Ctrl+C

kubectl exec -n flowlet-messaging kafka-0 -- kafka-console-consumer --bootstrap-server localhost:9092 --topic flowlet.transactions --from-beginning --max-messages 1
```

### 3. AI Service Testing

```bash
# Test fraud detection service
kubectl port-forward -n flowlet-core svc/ai-fraud-detection 3008:80 &
curl -X POST http://localhost:3008/analyze \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"tx123","amount":1000,"userId":"user123"}'

# Test AI chatbot
kubectl port-forward -n flowlet-core svc/ai-chatbot 3009:80 &
curl -X POST http://localhost:3009/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I create a wallet?","sessionId":"session123"}'
```

## Automated Testing Scripts

### 1. Health Check Script

```bash
#!/bin/bash
# health-check.sh

NAMESPACES=("flowlet-core" "flowlet-data" "flowlet-messaging" "flowlet-monitoring")

for ns in "${NAMESPACES[@]}"; do
    echo "Checking namespace: $ns"
    kubectl get pods -n $ns --no-headers | while read pod rest; do
        status=$(echo $rest | awk '{print $3}')
        if [ "$status" != "Running" ]; then
            echo "❌ Pod $pod in $ns is not running: $status"
        else
            echo "✅ Pod $pod in $ns is running"
        fi
    done
done
```

### 2. Performance Monitoring Script

```bash
#!/bin/bash
# performance-monitor.sh

echo "=== Resource Usage ==="
kubectl top nodes
echo ""
kubectl top pods --all-namespaces --sort-by=cpu

echo ""
echo "=== Service Response Times ==="
kubectl exec -n flowlet-core deployment/api-gateway -- curl -w "Response time: %{time_total}s\n" -o /dev/null -s http://wallet-service/health
kubectl exec -n flowlet-core deployment/api-gateway -- curl -w "Response time: %{time_total}s\n" -o /dev/null -s http://payments-service/health
```

### 3. Security Audit Script

```bash
#!/bin/bash
# security-audit.sh

echo "=== Network Policies ==="
kubectl get networkpolicies --all-namespaces

echo ""
echo "=== Secrets ==="
kubectl get secrets --all-namespaces | grep -v "default-token\|kubernetes.io"

echo ""
echo "=== Service Accounts ==="
kubectl get serviceaccounts --all-namespaces | grep -v default

echo ""
echo "=== RBAC ==="
kubectl get clusterroles | grep flowlet
kubectl get clusterrolebindings | grep flowlet
```

## Test Results Documentation

### Expected Results

1. **All pods should be in Running state**
2. **All services should respond to health checks**
3. **Database connections should be successful**
4. **API Gateway should route requests correctly**
5. **Monitoring should collect metrics**
6. **Security policies should be enforced**

### Common Issues and Solutions

#### Pod Startup Issues

- **Symptom**: Pods stuck in Pending or CrashLoopBackOff
- **Solution**: Check resource constraints, image availability, and configuration

#### Database Connection Issues

- **Symptom**: Services cannot connect to databases
- **Solution**: Verify network policies, service discovery, and credentials

#### Performance Issues

- **Symptom**: High response times or resource usage
- **Solution**: Check resource limits, database performance, and network latency

#### Security Issues

- **Symptom**: Unauthorized access or policy violations
- **Solution**: Review RBAC, network policies, and secret management

## Continuous Testing

### Automated Test Pipeline

```yaml
# .github/workflows/infrastructure-test.yml
name: Infrastructure Testing
on:
  push:
    paths:
      - "kubernetes/**"
      - "terraform/**"
      - "scripts/**"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Infrastructure
        run: ./scripts/validate.sh

  deploy-test:
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v3
      - name: Setup Kind Cluster
        uses: helm/kind-action@v1.4.0
      - name: Deploy Infrastructure
        run: ./scripts/deploy.sh
      - name: Run Health Checks
        run: ./scripts/health-check.sh
      - name: Run Integration Tests
        run: ./scripts/integration-test.sh
```

This comprehensive testing guide ensures that the Flowlet infrastructure is thoroughly validated before production deployment and provides ongoing monitoring and testing procedures for operational excellence.
