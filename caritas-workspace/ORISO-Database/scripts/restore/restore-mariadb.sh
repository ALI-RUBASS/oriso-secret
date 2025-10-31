#!/bin/bash

# MariaDB Restore Script
# Restores MariaDB databases from backup

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-directory>"
    echo "Example: $0 /tmp/mariadb-backup/20241031_120000"
    exit 1
fi

BACKUP_DIR="$1"
MARIADB_POD="mariadb-0"
NAMESPACE="caritas"
ROOT_PASSWORD="root"

echo "=================================================="
echo "MariaDB Restore for Online Beratung"
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

# Restore each database
for db in agencyservice consultingtypeservice tenantservice userservice videoservice uploadservice caritas; do
    BACKUP_FILE="$BACKUP_DIR/${db}.sql"
    
    # Check if backup file exists (compressed or uncompressed)
    if [ -f "${BACKUP_FILE}.gz" ]; then
        echo -e "${BLUE}Restoring $db from ${db}.sql.gz...${NC}"
        gunzip -c "${BACKUP_FILE}.gz" | kubectl exec -i -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD $db
        echo -e "${GREEN}✓ $db restored${NC}"
    elif [ -f "$BACKUP_FILE" ]; then
        echo -e "${BLUE}Restoring $db from ${db}.sql...${NC}"
        kubectl exec -i -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD $db < "$BACKUP_FILE"
        echo -e "${GREEN}✓ $db restored${NC}"
    else
        echo -e "${YELLOW}⚠ Backup file not found for $db, skipping${NC}"
    fi
    echo ""
done

echo -e "${GREEN}✓ MariaDB restore complete!${NC}"
echo ""
echo "Verification:"
kubectl exec -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD -e "
SELECT 
    TABLE_SCHEMA as 'Database',
    COUNT(*) as 'Tables'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA IN ('agencyservice', 'consultingtypeservice', 'tenantservice', 'userservice', 'videoservice', 'uploadservice', 'caritas')
GROUP BY TABLE_SCHEMA
ORDER BY TABLE_SCHEMA;
"

