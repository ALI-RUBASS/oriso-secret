#!/bin/bash

# MariaDB Backup Script
# Creates full backups of all MariaDB databases

set -e

BACKUP_DIR="${1:-/tmp/mariadb-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MARIADB_POD="mariadb-0"
NAMESPACE="caritas"
ROOT_PASSWORD="root"

echo "=================================================="
echo "MariaDB Backup for Online Beratung"
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

# Backup each database
for db in agencyservice consultingtypeservice tenantservice userservice videoservice uploadservice caritas; do
    echo -e "${BLUE}Backing up $db...${NC}"
    
    kubectl exec -n $NAMESPACE $MARIADB_POD -- mysqldump -u root -p$ROOT_PASSWORD \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        $db 2>/dev/null > "$BACKUP_DIR/$TIMESTAMP/${db}.sql"
    
    # Compress backup
    gzip "$BACKUP_DIR/$TIMESTAMP/${db}.sql"
    
    echo -e "${GREEN}✓ $db backed up ($(du -h "$BACKUP_DIR/$TIMESTAMP/${db}.sql.gz" | cut -f1))${NC}"
done

# Create a combined backup
echo ""
echo -e "${BLUE}Creating combined backup...${NC}"
cd "$BACKUP_DIR/$TIMESTAMP"
tar -czf "../mariadb-backup-${TIMESTAMP}.tar.gz" *.sql.gz
cd - > /dev/null

echo -e "${GREEN}✓ Combined backup created: mariadb-backup-${TIMESTAMP}.tar.gz${NC}"

# List backup contents
echo ""
echo "Backup Contents:"
ls -lh "$BACKUP_DIR/$TIMESTAMP/"
echo ""
echo "Combined Backup:"
ls -lh "$BACKUP_DIR/mariadb-backup-${TIMESTAMP}.tar.gz"

echo ""
echo -e "${GREEN}✓ MariaDB backup complete!${NC}"
echo "Backup location: $BACKUP_DIR/$TIMESTAMP/"

