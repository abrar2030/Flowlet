#!/bin/bash

# Flowlet Infrastructure Deployment Script (Enhanced for Financial Standards)

set -e

echo "🚀 Starting Flowlet Infrastructure Deployment (Enhanced Version)"

# Check for necessary CLI tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install $1 first."
        exit 1
    fi
}

check_command kubectl
check_command helm
check_command istioctl # For Istio

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Function to apply manifests with retry
apply_manifest() {
    local file=$1
    local retries=5
    local count=0

    while [ $count -lt $retries ]; do
        if kubectl apply -f "$file"; then
            echo "✅ Applied $file"
            return 0
        else
            count=$((count + 1))
            echo "⚠️  Failed to apply $file (attempt $count/$retries)"
            if [ $count -lt $retries ]; then
                sleep 10 # Increased sleep for more resilience
            fi
        fi
    done

    echo "❌ Failed to apply $file after $retries attempts"
    return 1
}

# Function to wait for resources
wait_for_resource() {
    local resource_type=$1
    local name=$2
    local namespace=$3
    local timeout=$4
    echo "⏳ Waiting for $resource_type/$name in namespace $namespace to be ready..."
    if ! kubectl wait --for=condition=Ready $resource_type/$name -n $namespace --timeout=${timeout}s; then
        echo "❌ $resource_type/$name in namespace $namespace did not become ready within ${timeout}s."
        exit 1
    fi
    echo "✅ $resource_type/$name in namespace $namespace is ready."
}

# 1. Create namespaces first
echo "📁 Creating namespaces..."
apply_manifest "kubernetes/namespaces/namespaces.yaml"

wait_for_resource namespace flowlet-core 60
wait_for_resource namespace flowlet-data 60
wait_for_resource namespace flowlet-messaging 60
wait_for_resource namespace flowlet-monitoring 60
wait_for_resource namespace flowlet-security 60

# 2. Deploy External Secrets Operator and Vault SecretStore (Prerequisite for secrets)
echo "🔑 Deploying External Secrets Operator and Vault SecretStore..."
# Assuming External Secrets Operator is installed via Helm or kubectl apply -f
# For simplicity, we'll assume it's already installed or provide a placeholder for its installation.
# Example: helm install external-secrets external-secrets/external-secrets -n external-secrets --create-namespace
# Example: kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/charts/external-secrets/crds/external-secrets.yaml
# You would typically install the operator and CRDs first.

# Deploy a placeholder Vault SecretStore for demonstration. In a real scenario, Vault would be external.
cat <<EOF | kubectl apply -f -
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-secret-store
  namespace: flowlet-security
spec:
  provider:
    vault:
      server: "http://vault.flowlet-security.svc.cluster.local:8200" # Replace with your Vault address
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "flowlet-app"
          serviceAccountRef:
            name: vault-auth
            namespace: flowlet-security
EOF

# Deploy security policies (including ExternalSecrets)
echo "🔒 Deploying security policies..."
apply_manifest "kubernetes/security/security-policies.yaml"

# 3. Deploy Istio Service Mesh (Base and Istiod)
echo "⚙️ Deploying Istio Service Mesh..."
istioctl install --set profile=default -y
kubectl label namespace flowlet-core istio-injection=enabled --overwrite
kubectl label namespace flowlet-data istio-injection=enabled --overwrite
kubectl label namespace flowlet-messaging istio-injection=enabled --overwrite
kubectl label namespace flowlet-monitoring istio-injection=enabled --overwrite

# 4. Deploy databases
echo "🗄️  Deploying databases..."
apply_manifest "kubernetes/databases/postgresql.yaml"
apply_manifest "kubernetes/databases/mongodb.yaml"
apply_manifest "kubernetes/databases/redis.yaml"
apply_manifest "kubernetes/databases/influxdb.yaml"

wait_for_resource pod -l app=postgresql flowlet-data 300
wait_for_resource pod -l app=mongodb flowlet-data 300
wait_for_resource pod -l app=redis flowlet-data 300
wait_for_resource pod -l app=influxdb flowlet-data 300

# 5. Deploy messaging systems
echo "📨 Deploying messaging systems..."
apply_manifest "kubernetes/messaging/kafka.yaml"
apply_manifest "kubernetes/messaging/rabbitmq.yaml"

wait_for_resource pod -l app=zookeeper flowlet-messaging 300
wait_for_resource pod -l app=kafka flowlet-messaging 300
wait_for_resource pod -l app=rabbitmq flowlet-messaging 300

# 6. Deploy core services
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

# 7. Deploy API Gateway and Developer Portal
echo "🌐 Deploying API Gateway and Developer Portal..."
apply_manifest "kubernetes/services/api-gateway.yaml"
apply_manifest "kubernetes/services/developer-portal.yaml"

# 8. Deploy monitoring
echo "📊 Deploying monitoring..."
apply_manifest "kubernetes/monitoring/prometheus.yaml"
apply_manifest "kubernetes/monitoring/grafana.yaml"

# 9. Deploy ingress and network policies
echo "🌍 Deploying ingress and network policies..."
apply_manifest "kubernetes/ingress/ingress.yaml"

# Wait for critical services to be ready
echo "⏳ Waiting for critical core services to be ready..."
wait_for_resource pod -l app=auth-service flowlet-core 300
wait_for_resource pod -l app=wallet-service flowlet-core 300
wait_for_resource pod -l app=payments-service flowlet-core 300
wait_for_resource pod -l app=api-gateway flowlet-core 300

echo "🎉 Flowlet Infrastructure Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "  ✅ Namespaces: flowlet-core, flowlet-data, flowlet-messaging, flowlet-monitoring, flowlet-security"
echo "  ✅ External Secrets Operator and Vault SecretStore configured"
echo "  ✅ Istio Service Mesh deployed and namespaces injected"
echo "  ✅ Databases: PostgreSQL, MongoDB, Redis, InfluxDB"
echo "  ✅ Messaging: Kafka, RabbitMQ"
echo "  ✅ Core Services: Wallet, Payments, Cards, KYC/AML, Ledger, Auth, Notifications"
echo "  ✅ AI Services: Fraud Detection, Chatbot"
echo "  ✅ Infrastructure: API Gateway, Developer Portal"
echo "  ✅ Monitoring: Prometheus, Grafana"
echo "  ✅ Security: Enhanced Policies and Network Controls"
echo ""
echo "🔗 Access Points:"
echo "  API Gateway: kubectl get svc api-gateway -n flowlet-core"
echo "  Developer Portal: kubectl get svc developer-portal -n flowlet-core"
echo "  Grafana: kubectl get svc grafana -n flowlet-monitoring"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure external DNS for ingress domains"
echo "  2. Ensure Vault is properly configured and accessible for External Secrets"
