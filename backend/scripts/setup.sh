#!/bin/bash
# Setup script for Flowlet Backend

set -e

echo "============================================"
echo "Flowlet Backend Setup"
echo "============================================"

# Check Python version
echo "Checking Python version..."
python3 --version

# Create virtual environment (optional)
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
echo "To activate virtual environment, run:"
echo "  source venv/bin/activate"
echo ""

# Install dependencies
echo "Installing dependencies..."
echo "Choose installation option:"
echo "  1) Minimal (basic functionality, faster)"
echo "  2) Full (all features, slower)"
read -p "Enter choice [1-2]: " choice

if [ "$choice" = "1" ]; then
    pip install -q --no-input -r requirements-minimal.txt
    echo "✓ Minimal dependencies installed"
else
    pip install -q --no-input -r requirements.txt
    echo "✓ Full dependencies installed"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created - please update with your configuration"
else
    echo "✓ .env file already exists"
fi

# Create database directory
if [ ! -d "database" ]; then
    mkdir -p database
    echo "✓ Database directory created"
fi

# Create logs directory
if [ ! -d "logs" ]; then
    mkdir -p logs
    echo "✓ Logs directory created"
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "To start the backend:"
echo "  python3 run_server.py"
echo ""
echo "Or for production:"
echo "  gunicorn -w 4 -b 0.0.0.0:5000 'app:create_app()'"
echo ""
echo "============================================"
