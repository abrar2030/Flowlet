#!/bin/bash
# Flowlet Platform Setup Script
# This script automates the installation process for Flowlet platform

set -e

# Default values
ENV="development"
NAMESPACE="flowlet-dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift
      shift
      ;;
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

echo "Setting up Flowlet platform in $ENV environment with namespace $NAMESPACE"

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE > /dev/null 2>&1 || kubectl create namespace $NAMESPACE

# Set up configuration secrets
echo "Setting up configuration secrets..."
kubectl create secret generic flowlet-secrets \
  --from-literal=db-password=$(openssl rand -base64 20) \
  --from-literal=api-key=$(openssl rand -base64 32) \
  --namespace $NAMESPACE

# Deploy core services
echo "Deploying core Flowlet services..."
helm dependency update ./kubernetes/helm/flowlet
helm install flowlet ./kubernetes/helm/flowlet \
  --namespace $NAMESPACE \
  --set environment=$ENV \
  --values ./kubernetes/helm/flowlet/values/$ENV.yaml

# Configure networking
echo "Configuring networking..."
kubectl apply -f ./kubernetes/manifests/ingress.yaml -n $NAMESPACE

# Initialize database schemas
echo "Initializing database schemas..."
kubectl apply -f ./kubernetes/jobs/init-system.yaml -n $NAMESPACE
kubectl wait --for=condition=complete job/flowlet-init -n $NAMESPACE --timeout=300s

echo "Setup complete! You can access the following services:"
echo "- Developer Portal: http://localhost:8080/developer"
echo "- Admin Dashboard: http://localhost:8080/admin"
echo ""
echo "Default credentials:"
echo "- Username: admin@flowlet.io"
echo "- Password: The password is available in the admin-credentials secret"
echo "  kubectl get secret admin-credentials -n $NAMESPACE -o jsonpath='{.data.password}' | base64 --decode"

# Verify installation
echo "Verifying installation..."
kubectl get pods -n $NAMESPACE
