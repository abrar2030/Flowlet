#!/bin/bash

# Build all Flowlet Docker images

set -e

echo "🐳 Building Flowlet Docker Images"

# Registry configuration
REGISTRY=${REGISTRY:-"flowlet"}
TAG=${TAG:-"latest"}

# Services to build
SERVICES=(
    "wallet-service"
    "payments-service"
    "card-service"
    "kyc-aml-service"
    "ledger-service"
    "api-gateway"
    "developer-portal"
    "auth-service"
    "notification-service"
    "ai-fraud-detection"
    "ai-chatbot"
)

# Function to build a service
build_service() {
    local service=$1
    local dockerfile_path="docker/$service/Dockerfile"
    local image_name="$REGISTRY/$service:$TAG"
    
    if [ -f "$dockerfile_path" ]; then
        echo "🔨 Building $service..."
        docker build -t "$image_name" -f "$dockerfile_path" "docker/$service/"
        echo "✅ Built $image_name"
    else
        echo "⚠️  Dockerfile not found for $service at $dockerfile_path"
    fi
}

# Build all services
for service in "${SERVICES[@]}"; do
    build_service "$service"
done

echo ""
echo "🎉 All Docker images built successfully!"
echo ""
echo "📋 Built Images:"
for service in "${SERVICES[@]}"; do
    echo "  - $REGISTRY/$service:$TAG"
done
echo ""
echo "📤 To push images to registry:"
echo "  docker push $REGISTRY/SERVICE_NAME:$TAG"
echo ""
echo "🔧 To use with different registry:"
echo "  REGISTRY=your-registry.com ./scripts/build-images.sh"

