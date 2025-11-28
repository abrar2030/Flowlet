#!/usr/bin/env bash

# Flowlet Platform - Robust Backup Script
# This script handles the backup of Flowlet application data, supporting different
# environments and database types.

# --- Security and Robustness ---
set -euo pipefail

# --- Configuration ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENV="production"
DB_TYPE="postgres"
BACKUP_DIR="/tmp/flowlet_backups"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/flowlet_${ENV}_${TIMESTAMP}.sql"

# --- Helper Functions ---

# Function to display usage
usage() {
    echo -e "${BLUE}Usage: $0 [OPTION]${NC}"
    echo -e "  --env <staging|production>  The environment to backup (default: production)."
    echo -e "  --db-type <postgres|mysql>  The type of database to backup (default: postgres)."
    echo -e "  -h, --help                  Display this help message."
    exit 1
}

# Function to log error and exit
log_error() {
  echo -e "${RED}❌ ERROR: $1${NC}"
  exit 1
}

# Function to perform PostgreSQL backup
backup_postgres() {
    echo -e "${YELLOW}Starting PostgreSQL backup for ${ENV}...${NC}"
    
    # Load credentials securely (e.g., from environment variables or a secret store)
    # NOTE: This assumes DB_HOST, DB_USER, DB_NAME, and PGPASSWORD are set securely
    
    if ! command_exists pg_dump; then
        log_error "pg_dump is required for PostgreSQL backup but not found."
    fi
    
    # Use a secure, non-interactive dump
    PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "${DB_HOST:-localhost}" -U "${DB_USER:-flowlet}" -d "${DB_NAME:-flowlet}" -Fc > "${BACKUP_FILE}"
    
    echo -e "${GREEN}✓ PostgreSQL backup saved to ${BACKUP_FILE}${NC}"
}

# Function to perform MySQL backup
backup_mysql() {
    echo -e "${YELLOW}Starting MySQL backup for ${ENV}...${NC}"
    
    if ! command_exists mysqldump; then
        log_error "mysqldump is required for MySQL backup but not found."
    fi
    
    # Use a secure, non-interactive dump
    mysqldump -h "${DB_HOST:-localhost}" -u "${DB_USER:-flowlet}" -p"${DB_PASSWORD:-}" "${DB_NAME:-flowlet}" > "${BACKUP_FILE}"
    
    echo -e "${GREEN}✓ MySQL backup saved to ${BACKUP_FILE}${NC}"
}

# --- Main Execution ---

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift
      shift
      ;;
    --db-type)
      DB_TYPE="$2"
      shift
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      ;;
  esac
done

echo -e "${BLUE}=========================================="
echo -e "Flowlet Data Backup - Environment: ${ENV}, DB: ${DB_TYPE}"
echo -e "==========================================${NC}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Dispatch based on DB type
case "${DB_TYPE}" in
    postgres)
        backup_postgres
        ;;
    mysql)
        backup_mysql
        ;;
    *)
        log_error "Unsupported database type: ${DB_TYPE}. Use 'postgres' or 'mysql'."
        ;;
esac

# Securely transfer the backup file (placeholder for enterprise-grade security)
echo -e "${YELLOW}Compressing and transferring backup to secure storage...${NC}"
gzip "${BACKUP_FILE}"
# Example: s3cmd put "${BACKUP_FILE}.gz" "s3://flowlet-backups/${ENV}/"
echo -e "${GREEN}✓ Backup compressed and ready for secure transfer.${NC}"

echo -e "${GREEN}=========================================="
echo -e "Backup process completed successfully."
echo -e "==========================================${NC}"
