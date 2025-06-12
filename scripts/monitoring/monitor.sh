#!/bin/bash

# Script to monitor Flowlet application in Kubernetes

echo "Getting pod status..."
kubectl get pods -l app=flowlet

echo "Getting service status..."
kubectl get svc -l app=flowlet

echo "Getting ingress status..."
kubectl get ingress flowlet-ingress


