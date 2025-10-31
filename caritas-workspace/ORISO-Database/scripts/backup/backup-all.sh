#!/bin/bash

# Master Backup Script
# Creates backups of all databases

set -e

BACKUP_ROOT="${1:-/tmp/online-beratung-backup}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "   Online Beratung - Complete Database Backup"
echo "=========================================================="
echo "Backup Directory: $BACKUP_ROOT/$TIMESTAMP"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create timestamped backup directory
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}Step 1/2: Backing up MariaDB...${NC}"
bash "$SCRIPT_DIR/backup-mariadb.sh" "$BACKUP_DIR/mariadb"
echo ""

echo -e "${BLUE}Step 2/2: Backing up MongoDB...${NC}"
bash "$SCRIPT_DIR/backup-mongodb.sh" "$BACKUP_DIR/mongodb"
echo ""

# Create final archive
echo -e "${BLUE}Creating final backup archive...${NC}"
cd "$BACKUP_ROOT"
tar -czf "online-beratung-complete-backup-${TIMESTAMP}.tar.gz" "$TIMESTAMP"
cd - > /dev/null

echo ""
echo "=========================================================="
echo -e "${GREEN}   BACKUP COMPLETE!${NC}"
echo "=========================================================="
echo ""
echo "Backup Location: $BACKUP_DIR"
echo "Archive: $BACKUP_ROOT/online-beratung-complete-backup-${TIMESTAMP}.tar.gz"
echo ""
echo "Backup Size:"
du -sh "$BACKUP_DIR"
du -sh "$BACKUP_ROOT/online-beratung-complete-backup-${TIMESTAMP}.tar.gz"
echo ""
echo "To restore from this backup, use the restore scripts in scripts/restore/"

