#!/bin/bash
# Backup script for Flowlet platform

set -e

# Default values
NAMESPACE="flowlet"
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --namespace)
      NAMESPACE="$2"
      shift
      shift
      ;;
    --backup-dir)
      BACKUP_DIR="$2"
      shift
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "Backing up Flowlet platform from namespace $NAMESPACE to $BACKUP_DIR"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/flowlet-backup-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# Backup Kubernetes resources
echo "Backing up Kubernetes resources..."
kubectl get all -n $NAMESPACE -o yaml > "$BACKUP_PATH/all-resources.yaml"
kubectl get configmap -n $NAMESPACE -o yaml > "$BACKUP_PATH/configmaps.yaml"
kubectl get secret -n $NAMESPACE -o yaml > "$BACKUP_PATH/secrets.yaml"
kubectl get pvc -n $NAMESPACE -o yaml > "$BACKUP_PATH/pvcs.yaml"

# Backup databases
echo "Backing up databases..."
kubectl exec -n $NAMESPACE deployment/flowlet-postgres -- pg_dumpall -c -U postgres > "$BACKUP_PATH/postgres-dump.sql"

# Backup Redis data
echo "Backing up Redis data..."
kubectl exec -n $NAMESPACE deployment/flowlet-redis -- redis-cli SAVE
kubectl cp $NAMESPACE/$(kubectl get pods -n $NAMESPACE -l app=redis -o jsonpath='{.items[0].metadata.name}'):/data/dump.rdb "$BACKUP_PATH/redis-dump.rdb"

# Create archive
echo "Creating backup archive..."
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "flowlet-backup-$TIMESTAMP"
rm -rf "$BACKUP_PATH"

echo "Backup completed successfully: $BACKUP_PATH.tar.gz"
