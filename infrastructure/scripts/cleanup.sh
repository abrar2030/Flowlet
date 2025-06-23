#!/bin/bash

# Cleanup Flowlet Infrastructure (Enhanced Version)

set -e

echo "🧹 Starting Flowlet Infrastructure Cleanup (Enhanced Version)"

# Function to delete resources with error handling
delete_resource() {
    local resource_type=$1
    local name=$2
    local namespace=$3

    if [ -n "$namespace" ]; then
        echo "Attempting to delete $resource_type/$name in namespace $namespace..."
        kubectl delete $resource_type $name -n $namespace --ignore-not-found=true --timeout=120s
    else
        echo "Attempting to delete $resource_type/$name..."
        kubectl delete $resource_type $name --ignore-not_found=true --timeout=120s
    fi
    if [ $? -eq 0 ]; then
        echo "✅ Deleted $resource_type/$name"
    else
        echo "❌ Failed to delete $resource_type/$name or timed out."
    fi
}

# 1. Uninstall Istio (if installed)
echo "⚙️ Uninstalling Istio..."
istioctl uninstall --purge -y --timeout 120s || true # Use true to prevent script from exiting if istio is not found
kubectl label namespace flowlet-core istio-injection- || true
kubectl label namespace flowlet-data istio-injection- || true
kubectl label namespace flowlet-messaging istio-injection- || true
kubectl label namespace flowlet-monitoring istio-injection- || true

# 2. Delete Ingress and Network Policies
echo "🌍 Removing ingress and network policies..."
delete_resource -f kubernetes/ingress/ingress.yaml

# 3. Delete Security Policies (including ExternalSecrets and SecretStore)
echo "🔒 Removing security policies and external secrets..."
delete_resource externalsecret flowlet-tls-secrets flowlet-security
delete_resource externalsecret flowlet-api-keys flowlet-security
delete_resource externalsecret flowlet-oauth-secrets flowlet-security
delete_resource secretstore vault-secret-store flowlet-security
delete_resource -f kubernetes/security/security-policies.yaml

# 4. Delete Monitoring Components
echo "📊 Removing monitoring components..."
delete_resource -f kubernetes/monitoring/grafana.yaml
delete_resource -f kubernetes/monitoring/prometheus.yaml

# 5. Delete Core Services
echo "🔧 Removing core services..."
delete_resource -f kubernetes/services/ai-chatbot.yaml
delete_resource -f kubernetes/services/ai-fraud-detection.yaml
delete_resource -f kubernetes/services/notification-service.yaml
delete_resource -f kubernetes/services/developer-portal.yaml
delete_resource -f kubernetes/services/api-gateway.yaml
delete_resource -f kubernetes/services/ledger-service.yaml
delete_resource -f kubernetes/services/kyc-aml-service.yaml
delete_resource -f kubernetes/services/card-service.yaml
delete_resource -f kubernetes/services/payments-service.yaml
delete_resource -f kubernetes/services/wallet-service.yaml
delete_resource -f kubernetes/services/auth-service.yaml

# 6. Delete Messaging Systems
echo "📨 Removing messaging systems..."
delete_resource -f kubernetes/messaging/rabbitmq.yaml
delete_resource -f kubernetes/messaging/kafka.yaml

# 7. Delete Databases
echo "🗄️  Removing databases..."
delete_resource -f kubernetes/databases/influxdb.yaml
delete_resource -f kubernetes/databases/redis.yaml
delete_resource -f kubernetes/databases/mongodb.yaml
delete_resource -f kubernetes/databases/postgresql.yaml

# 8. Delete Namespaces (this will delete everything in them)
echo "📁 Removing namespaces..."
delete_resource namespace flowlet-security
delete_resource namespace flowlet-monitoring
delete_resource namespace flowlet-messaging
delete_resource namespace flowlet-data
delete_resource namespace flowlet-core

echo ""
echo "🎉 Flowlet Infrastructure cleanup complete!"
echo ""
echo "⚠️  Note: Persistent volumes and associated data may still exist and need manual cleanup."
echo "   Run: kubectl get pv to check for remaining persistent volumes"
echo "   If you used Helm for any deployments, ensure to run 'helm uninstall <release-name> -n <namespace>' for each release."


