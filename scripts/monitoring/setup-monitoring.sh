#!/bin/bash
# Monitoring setup script for Flowlet platform

set -e

# Default values
NAMESPACE="flowlet"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --namespace)
      NAMESPACE="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "Setting up monitoring for Flowlet platform in namespace $NAMESPACE"

# Add Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
echo "Installing Prometheus stack..."
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin \
  --values ./kubernetes/monitoring/prometheus-values.yaml

# Install Loki for log aggregation
echo "Installing Loki for log aggregation..."
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi

# Install Jaeger for distributed tracing
echo "Installing Jaeger for distributed tracing..."
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.35.0/jaeger-operator.yaml
kubectl wait --for=condition=available deployment/jaeger-operator -n observability --timeout=300s

# Apply custom dashboards
echo "Applying custom dashboards..."
kubectl apply -f ./kubernetes/monitoring/dashboards/ -n monitoring

echo "Monitoring setup complete!"
echo "Access Grafana at: http://grafana.your-domain.com"
echo "Default credentials: admin / admin"
