#!/bin/bash

# Cleanup Flowlet Infrastructure

set -e

echo "🧹 Cleaning up Flowlet Infrastructure"

# Function to delete resources with error handling
delete_resource() {
    local resource=$1
    if kubectl get "$resource" &> /dev/null; then
        kubectl delete "$resource" --ignore-not-found=true
        echo "✅ Deleted $resource"
    else
        echo "ℹ️  $resource not found, skipping"
    fi
}

# Delete ingress and network policies
echo "🌍 Removing ingress and network policies..."
delete_resource "-f kubernetes/ingress/ingress.yaml"

# Delete security policies
echo "🔒 Removing security policies..."
delete_resource "-f kubernetes/security/security-policies.yaml"

# Delete monitoring
echo "📊 Removing monitoring..."
delete_resource "-f kubernetes/monitoring/grafana.yaml"
delete_resource "-f kubernetes/monitoring/prometheus.yaml"

# Delete services
echo "🔧 Removing core services..."
delete_resource "-f kubernetes/services/ai-chatbot.yaml"
delete_resource "-f kubernetes/services/ai-fraud-detection.yaml"
delete_resource "-f kubernetes/services/notification-service.yaml"
delete_resource "-f kubernetes/services/developer-portal.yaml"
delete_resource "-f kubernetes/services/api-gateway.yaml"
delete_resource "-f kubernetes/services/ledger-service.yaml"
delete_resource "-f kubernetes/services/kyc-aml-service.yaml"
delete_resource "-f kubernetes/services/card-service.yaml"
delete_resource "-f kubernetes/services/payments-service.yaml"
delete_resource "-f kubernetes/services/wallet-service.yaml"
delete_resource "-f kubernetes/services/auth-service.yaml"

# Delete messaging systems
echo "📨 Removing messaging systems..."
delete_resource "-f kubernetes/messaging/rabbitmq.yaml"
delete_resource "-f kubernetes/messaging/kafka.yaml"

# Delete databases
echo "🗄️  Removing databases..."
delete_resource "-f kubernetes/databases/influxdb.yaml"
delete_resource "-f kubernetes/databases/redis.yaml"
delete_resource "-f kubernetes/databases/mongodb.yaml"
delete_resource "-f kubernetes/databases/postgresql.yaml"

# Delete namespaces (this will delete everything in them)
echo "📁 Removing namespaces..."
delete_resource "namespace flowlet-security"
delete_resource "namespace flowlet-monitoring"
delete_resource "namespace flowlet-messaging"
delete_resource "namespace flowlet-data"
delete_resource "namespace flowlet-core"

echo ""
echo "🎉 Flowlet Infrastructure cleanup complete!"
echo ""
echo "⚠️  Note: Persistent volumes may still exist and need manual cleanup"
echo "   Run: kubectl get pv to check for remaining persistent volumes"

