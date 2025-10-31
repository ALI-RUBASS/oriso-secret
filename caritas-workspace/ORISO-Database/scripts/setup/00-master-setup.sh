#!/bin/bash

# Master Database Setup Script
# This script runs all database setup scripts in order

set -e

echo "=========================================================="
echo "   Online Beratung - Complete Database Setup"
echo "=========================================================="
echo ""
echo "This script will set up ALL databases for Online Beratung:"
echo "  1. MariaDB (AgencyService, UserService, TenantService, etc.)"
echo "  2. MongoDB (ConsultingTypes)"
echo "  3. Redis (Caching/Sessions)"
echo "  4. RabbitMQ (Messaging)"
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ kubectl is available and connected to cluster${NC}"
echo ""

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh

# Run each setup script
echo "=========================================================="
echo "Step 1/5: MariaDB Database Creation"
echo "=========================================================="
bash "$SCRIPT_DIR/01-mariadb-setup.sh"
echo ""

echo "=========================================================="
echo "Step 2/5: MariaDB Schema Application"
echo "=========================================================="
bash "$SCRIPT_DIR/02-apply-mariadb-schemas.sh"
echo ""

echo "=========================================================="
echo "Step 3/5: MongoDB Setup"
echo "=========================================================="
bash "$SCRIPT_DIR/03-mongodb-setup.sh"
echo ""

echo "=========================================================="
echo "Step 4/5: Redis Verification"
echo "=========================================================="
bash "$SCRIPT_DIR/04-redis-setup.sh"
echo ""

echo "=========================================================="
echo "Step 5/5: RabbitMQ Verification"
echo "=========================================================="
bash "$SCRIPT_DIR/05-rabbitmq-setup.sh"
echo ""

echo "=========================================================="
echo -e "${GREEN}   DATABASE SETUP COMPLETE! ${NC}"
echo "=========================================================="
echo ""
echo "Summary of ClusterIPs:"
echo "  - MariaDB:  10.43.123.72:3306"
echo "  - MongoDB:  10.43.61.124:27017"
echo "  - Redis:    10.43.113.3:6379"
echo "  - RabbitMQ: 10.43.157.60:5672"
echo ""
echo "All services can now connect to their respective databases!"
echo ""
echo "Next steps:"
echo "  1. Verify Liquibase is disabled in all ORISO services"
echo "  2. Deploy backend services"
echo "  3. Check service health: kubectl get pods -n caritas"
echo ""

