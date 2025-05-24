#!/bin/bash
# Deployment script for Flowlet platform

set -e

# Default values
ENV="production"
NAMESPACE="flowlet"

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

echo "Deploying Flowlet platform to $ENV environment in namespace $NAMESPACE"

# Update Helm dependencies
echo "Updating Helm dependencies..."
helm dependency update ./kubernetes/helm/flowlet

# Deploy or upgrade
if kubectl get ns $NAMESPACE > /dev/null 2>&1; then
  echo "Namespace exists, performing upgrade..."
  helm upgrade flowlet ./kubernetes/helm/flowlet \
    --namespace $NAMESPACE \
    --set environment=$ENV \
    --values ./kubernetes/helm/flowlet/values/$ENV.yaml
else
  echo "Namespace does not exist, performing fresh installation..."
  kubectl create namespace $NAMESPACE
  helm install flowlet ./kubernetes/helm/flowlet \
    --namespace $NAMESPACE \
    --set environment=$ENV \
    --values ./kubernetes/helm/flowlet/values/$ENV.yaml
fi

echo "Deployment complete!"
echo "Verifying deployment..."
kubectl get pods -n $NAMESPACE
