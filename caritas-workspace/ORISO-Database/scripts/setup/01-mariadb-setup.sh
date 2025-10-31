#!/bin/bash

# MariaDB Database Setup Script
# This script creates all required databases and users for Online Beratung services

set -e

echo "=================================================="
echo "MariaDB Database Setup for Online Beratung"
echo "=================================================="

MARIADB_POD="mariadb-0"
NAMESPACE="caritas"
ROOT_PASSWORD="root"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Creating databases...${NC}"

# Create all service databases
kubectl exec -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS agencyservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS consultingtypeservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS tenantservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS userservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS videoservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS uploadservice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS caritas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

echo -e "${GREEN}✓ Databases created${NC}"

echo -e "${BLUE}Step 2: Creating users and granting privileges...${NC}"

# Create users and grant privileges
kubectl exec -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD <<EOF
-- AgencyService User
CREATE USER IF NOT EXISTS 'agencyservice'@'%' IDENTIFIED BY 'agencyservice';
GRANT ALL PRIVILEGES ON agencyservice.* TO 'agencyservice'@'%';

-- ConsultingTypeService User
CREATE USER IF NOT EXISTS 'consultingtypeservice'@'%' IDENTIFIED BY 'consultingtypeservice';
GRANT ALL PRIVILEGES ON consultingtypeservice.* TO 'consultingtypeservice'@'%';

-- TenantService User
CREATE USER IF NOT EXISTS 'tenantservice'@'%' IDENTIFIED BY 'tenantservice';
GRANT ALL PRIVILEGES ON tenantservice.* TO 'tenantservice'@'%';

-- UserService User
CREATE USER IF NOT EXISTS 'userservice'@'%' IDENTIFIED BY 'userservice';
GRANT ALL PRIVILEGES ON userservice.* TO 'userservice'@'%';

-- VideoService User
CREATE USER IF NOT EXISTS 'videoservice'@'%' IDENTIFIED BY 'videoservice';
GRANT ALL PRIVILEGES ON videoservice.* TO 'videoservice'@'%';

-- UploadService User
CREATE USER IF NOT EXISTS 'uploadservice'@'%' IDENTIFIED BY 'uploadservice';
GRANT ALL PRIVILEGES ON uploadservice.* TO 'uploadservice'@'%';

-- Caritas User
CREATE USER IF NOT EXISTS 'caritas'@'%' IDENTIFIED BY 'caritas';
GRANT ALL PRIVILEGES ON caritas.* TO 'caritas'@'%';

FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✓ Users created and privileges granted${NC}"

echo -e "${BLUE}Step 3: Verifying databases...${NC}"

kubectl exec -n $NAMESPACE $MARIADB_POD -- mysql -u root -p$ROOT_PASSWORD -e "SHOW DATABASES LIKE '%service%'; SHOW DATABASES LIKE 'caritas';"

echo -e "${GREEN}✓ MariaDB setup complete!${NC}"
echo ""
echo "Database ClusterIP: 10.43.123.72:3306"
echo ""
echo "Created Databases:"
echo "  - agencyservice (user: agencyservice/agencyservice)"
echo "  - consultingtypeservice (user: consultingtypeservice/consultingtypeservice)"
echo "  - tenantservice (user: tenantservice/tenantservice)"
echo "  - userservice (user: userservice/userservice)"
echo "  - videoservice (user: videoservice/videoservice)"
echo "  - uploadservice (user: uploadservice/uploadservice)"
echo "  - caritas (user: caritas/caritas)"
echo ""
echo "Next step: Run 02-apply-mariadb-schemas.sh to apply schemas"

