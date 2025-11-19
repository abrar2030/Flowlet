#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

log_success() {
  echo "✅ SUCCESS: $1"
}

log_error() {
  echo "❌ ERROR: $1"
  exit 1
}

echo "Starting comprehensive linting process..."

# --- Python Linting Tools ---

echo "Installing Python linting tools..."
pip install flake8 black isort bandit || log_error "Failed to install Python linting tools."
log_success "Python linting tools installed."

echo "Running Flake8 (code style and quality)..."
flake8 Flowlet/backend/src --max-line-length=200 --ignore=E402,F401,E722,W503,F841 || log_error "Flake8 linting failed."
log_success "Flake8 linting completed."

echo "Running Black (code formatter)..."
black --check Flowlet/backend/src || log_error "Black formatting check failed. Run 'black Flowlet/backend/src' to fix."
log_success "Black formatting check completed."

echo "Running isort (import sorter)..."
isort --check-only Flowlet/backend/src || log_error "isort check failed. Run 'isort Flowlet/backend/src' to fix."
log_success "isort check completed."

echo "Running Bandit (security linter)..."
bandit -r Flowlet/backend/src -x Flowlet/backend/src/routes/kyc_aml.py,Flowlet/backend/src/routes/payment.py,Flowlet/backend/src/routes/security.py || log_error "Bandit security scan failed."
log_success "Bandit security scan completed."

# --- JavaScript/TypeScript Linting Tools ---

echo "Installing JavaScript/TypeScript linting tools..."
npm install -g eslint prettier || log_error "Failed to install JavaScript/TypeScript linting tools."
log_success "JavaScript/TypeScript linting tools installed."

echo "Running ESLint (JavaScript/TypeScript linter)..."
eslint Flowlet/frontend/web-frontend/src || log_error "ESLint linting failed."
log_success "ESLint linting completed."

echo "Running Prettier (code formatter)..."
prettier --check Flowlet/frontend/web-frontend/src || log_error "Prettier formatting check failed. Run 'prettier --write Flowlet/frontend/web-frontend/src' to fix."
log_success "Prettier formatting check completed."

echo "Linting process completed successfully."
