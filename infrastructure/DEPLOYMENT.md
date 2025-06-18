# Flowlet Infrastructure Deployment Instructions

## Quick Start Guide

This guide provides step-by-step instructions for deploying the Flowlet embedded finance platform infrastructure.

## Prerequisites

### System Requirements

- **Kubernetes Cluster**: Version 1.24 or higher
- **Compute Resources**: Minimum 16 CPU cores, 32GB RAM
- **Storage**: 500GB+ for persistent volumes
- **Network**: Load balancer support for external access

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install terraform (optional)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installations
kubectl version --client
helm version
terraform version
```

## Deployment Options

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Extract the infrastructure package
unzip flowlet-infrastructure.zip
cd flowlet-infrastructure

# 2. Make scripts executable (if needed)
chmod +x scripts/*.sh

# 3. Validate the infrastructure
./scripts/validate.sh

# 4. Deploy the complete infrastructure
./scripts/deploy.sh

# 5. Monitor deployment progress
watch kubectl get pods --all-namespaces
```

### Option 2: Manual Step-by-Step Deployment

```bash
# 1. Create namespaces
kubectl apply -f kubernetes/namespaces/namespaces.yaml

# 2. Deploy databases
kubectl apply -f kubernetes/databases/postgresql.yaml
kubectl apply -f kubernetes/databases/mongodb.yaml
kubectl apply -f kubernetes/databases/redis.yaml
kubectl apply -f kubernetes/databases/influxdb.yaml

# Wait for databases to be ready
kubectl wait --for=condition=Ready pod -l app=postgresql -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=mongodb -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=redis -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=influxdb -n flowlet-data --timeout=300s

# 3. Deploy messaging systems
kubectl apply -f kubernetes/messaging/kafka.yaml
kubectl apply -f kubernetes/messaging/rabbitmq.yaml

# Wait for messaging systems
kubectl wait --for=condition=Ready pod -l app=kafka -n flowlet-messaging --timeout=300s
kubectl wait --for=condition=Ready pod -l app=rabbitmq -n flowlet-messaging --timeout=300s

# 4. Deploy core services
kubectl apply -f kubernetes/services/auth-service.yaml
kubectl apply -f kubernetes/services/wallet-service.yaml
kubectl apply -f kubernetes/services/payments-service.yaml
kubectl apply -f kubernetes/services/card-service.yaml
kubectl apply -f kubernetes/services/kyc-aml-service.yaml
kubectl apply -f kubernetes/services/ledger-service.yaml
kubectl apply -f kubernetes/services/notification-service.yaml
kubectl apply -f kubernetes/services/ai-fraud-detection.yaml
kubectl apply -f kubernetes/services/ai-chatbot.yaml

# 5. Deploy infrastructure services
kubectl apply -f kubernetes/services/api-gateway.yaml
kubectl apply -f kubernetes/services/developer-portal.yaml

# 6. Deploy monitoring
kubectl apply -f kubernetes/monitoring/prometheus.yaml
kubectl apply -f kubernetes/monitoring/grafana.yaml

# 7. Deploy security and networking
kubectl apply -f kubernetes/security/security-policies.yaml
kubectl apply -f kubernetes/ingress/ingress.yaml
```

### Option 3: Terraform Deployment

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Plan the deployment
terraform plan

# 3. Apply the infrastructure
terraform apply

# 4. Get outputs
terraform output
```

## Configuration

### 1. Update Secrets

Before deployment, update the default passwords and API keys:

```bash
# Database passwords
kubectl create secret generic postgres-credentials \
  --from-literal=username=flowlet \
  --from-literal=password=YOUR_SECURE_POSTGRES_PASSWORD \
  --from-literal=database=flowlet \
  -n flowlet-data

kubectl create secret generic mongodb-credentials \
  --from-literal=username=flowlet \
  --from-literal=password=YOUR_SECURE_MONGODB_PASSWORD \
  --from-literal=database=flowlet \
  -n flowlet-data

kubectl create secret generic redis-credentials \
  --from-literal=password=YOUR_SECURE_REDIS_PASSWORD \
  -n flowlet-data

# External API keys
kubectl create secret generic flowlet-api-keys \
  --from-literal=stripe-api-key=YOUR_STRIPE_API_KEY \
  --from-literal=sendgrid-api-key=YOUR_SENDGRID_API_KEY \
  --from-literal=twilio-api-key=YOUR_TWILIO_API_KEY \
  --from-literal=openai-api-key=YOUR_OPENAI_API_KEY \
  -n flowlet-security

# OAuth secrets
kubectl create secret generic flowlet-oauth-secrets \
  --from-literal=google-client-secret=YOUR_GOOGLE_CLIENT_SECRET \
  --from-literal=github-client-secret=YOUR_GITHUB_CLIENT_SECRET \
  -n flowlet-security
```

### 2. Configure Domain Names

Update the ingress configuration with your domain names:

```bash
# Edit the ingress file
nano kubernetes/ingress/ingress.yaml

# Update the hosts section:
# - host: api.yourdomain.com
# - host: portal.yourdomain.com

# Apply the changes
kubectl apply -f kubernetes/ingress/ingress.yaml
```

### 3. TLS Certificates

```bash
# Install cert-manager for automatic TLS
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create a ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Verification

### 1. Check Pod Status

```bash
# Check all pods are running
kubectl get pods --all-namespaces

# Check specific namespaces
kubectl get pods -n flowlet-core
kubectl get pods -n flowlet-data
kubectl get pods -n flowlet-messaging
kubectl get pods -n flowlet-monitoring
```

### 2. Check Services

```bash
# Check all services
kubectl get svc --all-namespaces

# Get external IPs
kubectl get svc -n flowlet-core -o wide
kubectl get svc -n flowlet-monitoring -o wide
```

### 3. Test API Gateway

```bash
# Port-forward to test locally
kubectl port-forward -n flowlet-core svc/api-gateway 8080:80 &

# Test health endpoint
curl http://localhost:8080/health

# Test API endpoints
curl http://localhost:8080/api/v1/status
```

### 4. Access Monitoring

```bash
# Port-forward to Grafana
kubectl port-forward -n flowlet-monitoring svc/grafana 3000:3000 &

# Access Grafana at http://localhost:3000
# Default credentials: admin / admin123
```

## Post-Deployment Configuration

### 1. Database Initialization

```bash
# Initialize PostgreSQL schemas
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "
CREATE SCHEMA IF NOT EXISTS wallets;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS cards;
CREATE SCHEMA IF NOT EXISTS kyc;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS notifications;
"

# Create initial admin user
kubectl exec -n flowlet-core deployment/auth-service -- curl -X POST http://localhost:3006/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"secure_admin_password","role":"admin"}'
```

### 2. Configure External Integrations

```bash
# Update service configurations with your API keys
kubectl patch configmap wallet-service-config -n flowlet-core --patch '
data:
  application.yml: |
    # Your updated configuration
'

# Restart services to pick up new configuration
kubectl rollout restart deployment/wallet-service -n flowlet-core
kubectl rollout restart deployment/payments-service -n flowlet-core
```

### 3. Set Up Monitoring Alerts

```bash
# Configure Prometheus alerting rules
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
  namespace: flowlet-monitoring
data:
  alerts.yml: |
    groups:
    - name: flowlet.alerts
      rules:
      - alert: ServiceDown
        expr: up{job="flowlet-services"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Flowlet service is down"
          description: "Service {{ \$labels.kubernetes_name }} has been down for more than 1 minute"
EOF
```

## Scaling

### 1. Horizontal Pod Autoscaling

```bash
# Enable HPA for core services
kubectl autoscale deployment wallet-service --cpu-percent=70 --min=3 --max=20 -n flowlet-core
kubectl autoscale deployment payments-service --cpu-percent=70 --min=3 --max=20 -n flowlet-core
kubectl autoscale deployment api-gateway --cpu-percent=70 --min=3 --max=15 -n flowlet-core
```

### 2. Database Scaling

```bash
# Scale PostgreSQL (if using a cluster setup)
kubectl scale statefulset postgresql --replicas=3 -n flowlet-data

# Scale Redis (if using cluster mode)
kubectl scale statefulset redis --replicas=6 -n flowlet-data
```

## Backup and Recovery

### 1. Database Backups

```bash
# Create backup script
cat <<EOF > backup-databases.sh
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
kubectl exec -n flowlet-data postgresql-0 -- pg_dump -U flowlet flowlet > "postgres_backup_\${DATE}.sql"

# MongoDB backup
kubectl exec -n flowlet-data mongodb-0 -- mongodump --db flowlet --out /tmp/backup_\${DATE}
kubectl cp flowlet-data/mongodb-0:/tmp/backup_\${DATE} ./mongodb_backup_\${DATE}

# Redis backup
kubectl exec -n flowlet-data redis-0 -- redis-cli BGSAVE
kubectl exec -n flowlet-data redis-0 -- cp /data/dump.rdb /tmp/redis_backup_\${DATE}.rdb
kubectl cp flowlet-data/redis-0:/tmp/redis_backup_\${DATE}.rdb ./redis_backup_\${DATE}.rdb

echo "Backups completed: \${DATE}"
EOF

chmod +x backup-databases.sh
```

### 2. Configuration Backups

```bash
# Backup all Kubernetes configurations
kubectl get all --all-namespaces -o yaml > flowlet-k8s-backup.yaml
kubectl get configmaps --all-namespaces -o yaml > flowlet-configmaps-backup.yaml
kubectl get secrets --all-namespaces -o yaml > flowlet-secrets-backup.yaml
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace> --previous

# Check resource constraints
kubectl top nodes
kubectl describe nodes
```

#### 2. Service Connectivity Issues

```bash
# Test DNS resolution
kubectl exec -n flowlet-core deployment/api-gateway -- nslookup postgresql.flowlet-data.svc.cluster.local

# Test port connectivity
kubectl exec -n flowlet-core deployment/api-gateway -- nc -zv postgresql.flowlet-data.svc.cluster.local 5432

# Check network policies
kubectl get networkpolicies --all-namespaces
```

#### 3. Database Connection Issues

```bash
# Check database status
kubectl exec -n flowlet-data postgresql-0 -- pg_isready -U flowlet

# Check credentials
kubectl get secret postgres-credentials -n flowlet-data -o yaml

# Test connection from service
kubectl exec -n flowlet-core deployment/wallet-service -- psql -h postgresql.flowlet-data.svc.cluster.local -U flowlet -d flowlet -c "SELECT 1;"
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods --all-namespaces --sort-by=cpu
kubectl top pods --all-namespaces --sort-by=memory

# Check HPA status
kubectl get hpa --all-namespaces

# Check database performance
kubectl exec -n flowlet-data postgresql-0 -- psql -U flowlet -d flowlet -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;"
```

## Maintenance

### Regular Tasks

```bash
# Update container images
kubectl set image deployment/wallet-service wallet-service=flowlet/wallet-service:v1.2.0 -n flowlet-core

# Rotate secrets
kubectl create secret generic postgres-credentials-new --from-literal=password=NEW_PASSWORD -n flowlet-data
kubectl patch deployment wallet-service -n flowlet-core -p '{"spec":{"template":{"spec":{"containers":[{"name":"wallet-service","env":[{"name":"DB_PASSWORD","valueFrom":{"secretKeyRef":{"name":"postgres-credentials-new","key":"password"}}}]}]}}}}'

# Clean up old resources
kubectl delete pod --field-selector=status.phase==Succeeded --all-namespaces
kubectl delete pod --field-selector=status.phase==Failed --all-namespaces
```

### Monitoring Health

```bash
# Create health check script
cat <<EOF > health-check.sh
#!/bin/bash
echo "=== Flowlet Infrastructure Health Check ==="
echo "Date: \$(date)"
echo ""

echo "=== Pod Status ==="
kubectl get pods --all-namespaces | grep -v Running | grep -v Completed

echo ""
echo "=== Service Status ==="
kubectl get svc --all-namespaces -o wide

echo ""
echo "=== Resource Usage ==="
kubectl top nodes
kubectl top pods -n flowlet-core --sort-by=cpu

echo ""
echo "=== Recent Events ==="
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -10
EOF

chmod +x health-check.sh
```

## Support and Documentation

### Additional Resources

- **API Documentation**: Access via Developer Portal at `https://portal.yourdomain.com`
- **Monitoring Dashboards**: Access Grafana at `https://monitoring.yourdomain.com`
- **Infrastructure Guide**: See `docs/infrastructure-guide.md`
- **Testing Guide**: See `docs/testing-guide.md`

### Getting Help

1. **Check the logs**: `kubectl logs <pod-name> -n <namespace>`
2. **Review the documentation**: All guides are in the `docs/` directory
3. **Run diagnostics**: Use the validation and health check scripts
4. **Community Support**: GitHub issues and community forums
5. **Enterprise Support**: Contact enterprise@flowlet.com

### Security Considerations

- **Change default passwords** before production deployment
- **Configure TLS certificates** for all external endpoints
- **Review network policies** and security configurations
- **Enable audit logging** for compliance requirements
- **Regular security updates** for all components

---

**Congratulations!** You have successfully deployed the Flowlet embedded finance platform infrastructure. The platform is now ready for application deployment and integration.

