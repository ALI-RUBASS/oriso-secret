#!/bin/bash

# MongoDB Restore Script
# Restores MongoDB databases from backup

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-directory>"
    echo "Example: $0 /tmp/mongodb-backup/20241031_120000/mongodb-backup"
    exit 1
fi

BACKUP_DIR="$1"
NAMESPACE="caritas"

echo "=================================================="
echo "MongoDB Restore for Online Beratung"
echo "=================================================="
echo "Backup Directory: $BACKUP_DIR"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Get MongoDB pod name
MONGODB_POD=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath="{.items[0].metadata.name}")

echo -e "${BLUE}Using MongoDB Pod: $MONGODB_POD${NC}"
echo ""

echo -e "${BLUE}Copying backup to MongoDB pod...${NC}"
kubectl cp "$BACKUP_DIR" "$NAMESPACE/$MONGODB_POD:/tmp/mongodb-restore"

echo -e "${BLUE}Restoring consulting_types database...${NC}"
kubectl exec -n $NAMESPACE $MONGODB_POD -- mongorestore \
    --db=consulting_types \
    --dir=/tmp/mongodb-restore/consulting_types \
    --drop 2>/dev/null

echo -e "${GREEN}✓ MongoDB restore complete!${NC}"
echo ""
echo "Verification:"
kubectl exec -n $NAMESPACE $MONGODB_POD -- mongosh --quiet --eval "
use consulting_types;
print('Collections:');
db.getCollectionNames().forEach(function(col) { 
    var count = db[col].countDocuments();
    print('  - ' + col + ': ' + count + ' documents');
});
"

