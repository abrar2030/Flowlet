#!/bin/bash

# Script to deploy Flowlet application to Kubernetes

echo "Applying Kubernetes manifests..."
kubectl apply -f ../kubernetes/manifests/

echo "Deploying Helm chart..."
helm upgrade --install flowlet ../kubernetes/helm/flowlet-chart

echo "Deployment complete."


