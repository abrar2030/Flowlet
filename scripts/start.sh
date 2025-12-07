#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

# Flowlet Start Script
# This script is a wrapper to start the application in development mode.

# --- Configuration ---
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_START_SCRIPT="$PROJECT_ROOT/dev-start.sh"

# --- Main Start Logic ---

if [ ! -f "$DEV_START_SCRIPT" ]; then
    echo "Error: Development start script not found at $DEV_START_SCRIPT."
    echo "Please run './scripts/setup.sh --env development' first to create it."
    exit 1
fi

echo "Starting Flowlet development environment..."
exec "$DEV_START_SCRIPT"
