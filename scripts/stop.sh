#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -euo pipefail

# Flowlet Stop Script
# This script stops the running development servers.

# --- Configuration ---
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Main Stop Logic ---

echo "Attempting to stop Flowlet development servers..."

# The dev-start.sh script uses pkill -P $$ to kill its child processes.
# We need to find the process ID of the dev-start.sh script itself.
# Since dev-start.sh is created in the root, we'll look for it.

DEV_START_PID=$(pgrep -f "$PROJECT_ROOT/dev-start.sh")

if [ -n "$DEV_START_PID" ]; then
    echo "Found dev-start.sh process with PID: $DEV_START_PID. Sending SIGINT..."
    # Send SIGINT to trigger the cleanup trap in dev-start.sh
    kill -SIGINT "$DEV_START_PID"
    
    # Wait a moment for cleanup
    sleep 2
    
    # Check if it's still running and force kill if necessary
    if kill -0 "$DEV_START_PID" 2>/dev/null; then
        echo "Process is still running. Force killing..."
        kill -9 "$DEV_START_PID"
    fi
    
    echo "Flowlet development servers stopped."
else
    echo "No running Flowlet development servers found."
fi
