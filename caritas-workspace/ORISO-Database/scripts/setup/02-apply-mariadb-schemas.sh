#!/bin/bash

# Apply MariaDB Schemas Script
# This script applies all exported schemas to the MariaDB databases

set -e

echo "=================================================="
echo "Applying MariaDB Schemas for Online Beratung"
echo "=================================================="

MARIADB_POD="mariadb-0"
NAMESPACE="caritas"
ROOT_PASSWORD="root"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$BASE_DIR"

echo -e "${BLUE}Applying schemas from: $BASE_DIR/mariadb/${NC}"
echo ""

# Apply schemas for each database
for db in agencyservice consultingtypeservice tenantservice userservice videoservice uploadservice caritas; do
    SCHEMA_FILE="mariadb/$db/schema.sql"
    
    if [ -f "$SCHEMA_FILE" ]; then
        echo -e "${BLUE}Applying schema for $db...${NC}"
        
        # Check if file is not empty
        if [ -s "$SCHEMA_FILE" ]; then
            kubectl exec -i -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD $db < "$SCHEMA_FILE"
            echo -e "${GREEN}✓ $db schema applied${NC}"
        else
            echo -e "${YELLOW}⚠ $db schema file is empty, skipping${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Schema file not found for $db, skipping${NC}"
    fi
    echo ""
done

echo -e "${GREEN}✓ All MariaDB schemas applied!${NC}"
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

echo ""
echo "MariaDB setup complete! Services can now connect to the databases."

