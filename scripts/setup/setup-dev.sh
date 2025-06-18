#!/bin/bash
# Setup script for development environment

# Check prerequisites
echo "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "Helm is required but not installed. Aborting." >&2; exit 1; }

# Set up local environment
echo "Setting up local development environment..."
cd "$(dirname "$0")/.."

# Create local configuration
if [ ! -f .env.local ]; then
  echo "Creating local environment configuration..."
  cp .env.example .env.local
  echo "Please update .env.local with your local configuration values."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start local services
echo "Starting local services..."
docker-compose up -d

echo "Setup complete! Your development environment is ready."
echo "Run 'npm run dev' to start the development server."
