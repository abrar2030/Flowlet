#!/bin/bash

# Script to set up the Kubernetes cluster prerequisites for Flowlet.
# This might include installing kubectl, configuring cloud provider CLI, etc.

echo "Checking for kubectl..."
if ! command -v kubectl &> /dev/null
then
    echo "kubectl not found. Please install kubectl to proceed."
    exit 1
fi

echo "Kubectl is installed. You are ready to deploy Flowlet."
