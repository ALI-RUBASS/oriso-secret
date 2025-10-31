#!/bin/bash

# MongoDB Backup Script
# Creates full backups of MongoDB databases

set -e

BACKUP_DIR="${1:-/tmp/mongodb-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NAMESPACE="caritas"

echo "=================================================="
echo "MongoDB Backup for Online Beratung"
echo "=================================================="
echo "Backup Directory: $BACKUP_DIR"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get MongoDB pod name
MONGODB_POD=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath="{.items[0].metadata.name}")

echo -e "${BLUE}Using MongoDB Pod: $MONGODB_POD${NC}"
echo ""

echo -e "${BLUE}Backing up consulting_types database...${NC}"

# Backup using mongodump inside the pod, then copy out
kubectl exec -n $NAMESPACE $MONGODB_POD -- mongodump \
    --db=consulting_types \
    --out=/tmp/mongodb-backup 2>/dev/null

# Copy backup from pod to local
kubectl cp $NAMESPACE/$MONGODB_POD:/tmp/mongodb-backup "$BACKUP_DIR/$TIMESTAMP/"

# Compress backup
echo -e "${BLUE}Compressing backup...${NC}"
cd "$BACKUP_DIR"
tar -czf "mongodb-backup-${TIMESTAMP}.tar.gz" "$TIMESTAMP"
cd - > /dev/null

echo -e "${GREEN}✓ MongoDB backup complete!${NC}"
echo ""
echo "Backup Contents:"
ls -lh "$BACKUP_DIR/$TIMESTAMP/mongodb-backup/"
echo ""
echo "Compressed Backup:"
ls -lh "$BACKUP_DIR/mongodb-backup-${TIMESTAMP}.tar.gz"

echo ""
echo "Backup location: $BACKUP_DIR/$TIMESTAMP/"

