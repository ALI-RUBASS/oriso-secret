#!/bin/bash

# Redis Setup Script
# This script documents Redis configuration for Online Beratung services

echo "=================================================="
echo "Redis Setup for Online Beratung"
echo "=================================================="

NAMESPACE="caritas"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Redis pod name dynamically
REDIS_POD=$(kubectl get pods -n $NAMESPACE -l app=redis -o jsonpath="{.items[0].metadata.name}")

echo -e "${BLUE}Using Redis Pod: $REDIS_POD${NC}"
echo ""

echo -e "${BLUE}Redis Configuration:${NC}"
echo "  ClusterIP: 10.43.113.3:6379"
echo "  Password: (check your deployment config)"
echo ""

echo -e "${BLUE}Verifying Redis connection...${NC}"

kubectl exec -n $NAMESPACE $REDIS_POD -- redis-cli ping 2>/dev/null && echo -e "${GREEN}✓ Redis is responding${NC}" || echo -e "${YELLOW}⚠ Redis connection failed${NC}"

echo ""
echo -e "${BLUE}Redis Info:${NC}"
kubectl exec -n $NAMESPACE $REDIS_POD -- redis-cli INFO server 2>/dev/null | grep -E "redis_version|os|arch|tcp_port"

echo ""
echo -e "${GREEN}✓ Redis setup complete!${NC}"
echo ""
echo "Redis is used for:"
echo "  - Session storage"
echo "  - Caching"
echo "  - Temporary data storage"
echo ""
echo "Note: Redis is schema-less and does not require initialization"
echo "      Data will be created automatically by services"

