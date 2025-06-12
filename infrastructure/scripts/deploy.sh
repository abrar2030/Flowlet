#!/bin/bash

# Flowlet Infrastructure Deployment Script

set -e

echo "🚀 Starting Flowlet Infrastructure Deployment"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Function to apply manifests with retry
apply_manifest() {
    local file=$1
    local retries=3
    local count=0
    
    while [ $count -lt $retries ]; do
        if kubectl apply -f "$file"; then
            echo "✅ Applied $file"
            return 0
        else
            count=$((count + 1))
            echo "⚠️  Failed to apply $file (attempt $count/$retries)"
            if [ $count -lt $retries ]; then
                sleep 5
            fi
        fi
    done
    
    echo "❌ Failed to apply $file after $retries attempts"
    return 1
}

# Create namespaces first
echo "📁 Creating namespaces..."
apply_manifest "kubernetes/namespaces/namespaces.yaml"

# Wait for namespaces to be ready
echo "⏳ Waiting for namespaces to be ready..."
kubectl wait --for=condition=Active namespace/flowlet-core --timeout=60s
kubectl wait --for=condition=Active namespace/flowlet-data --timeout=60s
kubectl wait --for=condition=Active namespace/flowlet-messaging --timeout=60s
kubectl wait --for=condition=Active namespace/flowlet-monitoring --timeout=60s
kubectl wait --for=condition=Active namespace/flowlet-security --timeout=60s

# Deploy databases
echo "🗄️  Deploying databases..."
apply_manifest "kubernetes/databases/postgresql.yaml"
apply_manifest "kubernetes/databases/mongodb.yaml"
apply_manifest "kubernetes/databases/redis.yaml"
apply_manifest "kubernetes/databases/influxdb.yaml"

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=Ready pod -l app=postgresql -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=mongodb -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=redis -n flowlet-data --timeout=300s
kubectl wait --for=condition=Ready pod -l app=influxdb -n flowlet-data --timeout=300s

# Deploy messaging systems
echo "📨 Deploying messaging systems..."
apply_manifest "kubernetes/messaging/kafka.yaml"
apply_manifest "kubernetes/messaging/rabbitmq.yaml"

# Wait for messaging systems to be ready
echo "⏳ Waiting for messaging systems to be ready..."
kubectl wait --for=condition=Ready pod -l app=zookeeper -n flowlet-messaging --timeout=300s
kubectl wait --for=condition=Ready pod -l app=kafka -n flowlet-messaging --timeout=300s
kubectl wait --for=condition=Ready pod -l app=rabbitmq -n flowlet-messaging --timeout=300s

# Deploy core services
echo "🔧 Deploying core services..."
apply_manifest "kubernetes/services/auth-service.yaml"
apply_manifest "kubernetes/services/wallet-service.yaml"
apply_manifest "kubernetes/services/payments-service.yaml"
apply_manifest "kubernetes/services/card-service.yaml"
apply_manifest "kubernetes/services/kyc-aml-service.yaml"
apply_manifest "kubernetes/services/ledger-service.yaml"
apply_manifest "kubernetes/services/notification-service.yaml"
apply_manifest "kubernetes/services/ai-fraud-detection.yaml"
apply_manifest "kubernetes/services/ai-chatbot.yaml"

# Deploy API Gateway and Developer Portal
echo "🌐 Deploying API Gateway and Developer Portal..."
apply_manifest "kubernetes/services/api-gateway.yaml"
apply_manifest "kubernetes/services/developer-portal.yaml"

# Deploy monitoring
echo "📊 Deploying monitoring..."
apply_manifest "kubernetes/monitoring/prometheus.yaml"
apply_manifest "kubernetes/monitoring/grafana.yaml"

# Deploy security policies
echo "🔒 Deploying security policies..."
apply_manifest "kubernetes/security/security-policies.yaml"

# Deploy ingress and network policies
echo "🌍 Deploying ingress and network policies..."
apply_manifest "kubernetes/ingress/ingress.yaml"

# Wait for core services to be ready
echo "⏳ Waiting for core services to be ready..."
kubectl wait --for=condition=Ready pod -l app=auth-service -n flowlet-core --timeout=300s
kubectl wait --for=condition=Ready pod -l app=wallet-service -n flowlet-core --timeout=300s
kubectl wait --for=condition=Ready pod -l app=payments-service -n flowlet-core --timeout=300s
kubectl wait --for=condition=Ready pod -l app=api-gateway -n flowlet-core --timeout=300s

echo "🎉 Flowlet Infrastructure Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "  ✅ Namespaces: flowlet-core, flowlet-data, flowlet-messaging, flowlet-monitoring, flowlet-security"
echo "  ✅ Databases: PostgreSQL, MongoDB, Redis, InfluxDB"
echo "  ✅ Messaging: Kafka, RabbitMQ"
echo "  ✅ Core Services: Wallet, Payments, Cards, KYC/AML, Ledger, Auth, Notifications"
echo "  ✅ AI Services: Fraud Detection, Chatbot"
echo "  ✅ Infrastructure: API Gateway, Developer Portal"
echo "  ✅ Monitoring: Prometheus, Grafana"
echo "  ✅ Security: Policies and Network Controls"
echo ""
echo "🔗 Access Points:"
echo "  API Gateway: kubectl get svc api-gateway -n flowlet-core"
echo "  Developer Portal: kubectl get svc developer-portal -n flowlet-core"
echo "  Grafana: kubectl get svc grafana -n flowlet-monitoring"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure external DNS for ingress domains"
echo "  2. Update TLS certificates in security secrets"
echo "  3. Configure external API keys for third-party integrations"
echo "  4. Set up backup and disaster recovery procedures"
echo "  5. Configure monitoring alerts and notifications"

