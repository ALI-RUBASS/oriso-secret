#!/bin/bash

# MongoDB Database Setup Script
# This script initializes MongoDB for Online Beratung services

set -e

echo "=================================================="
echo "MongoDB Database Setup for Online Beratung"
echo "=================================================="

NAMESPACE="caritas"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get MongoDB pod name dynamically
MONGODB_POD=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath="{.items[0].metadata.name}")

echo -e "${BLUE}Using MongoDB Pod: $MONGODB_POD${NC}"
echo ""

echo -e "${BLUE}Step 1: Creating consulting_types database...${NC}"

kubectl exec -n $NAMESPACE $MONGODB_POD -- mongosh --quiet --eval "
use consulting_types;
db.createCollection('consultingTypes');
db.createCollection('topics');
db.createCollection('topicGroups');
print('✓ Collections created');
"

echo -e "${GREEN}✓ MongoDB databases and collections created${NC}"

echo -e "${BLUE}Step 2: Creating indexes...${NC}"

kubectl exec -n $NAMESPACE $MONGODB_POD -- mongosh --quiet --eval "
use consulting_types;
db.consultingTypes.createIndex({ 'id': 1 }, { unique: true });
db.topics.createIndex({ 'id': 1 }, { unique: true });
db.topicGroups.createIndex({ 'id': 1 }, { unique: true });
print('✓ Indexes created');
"

echo -e "${GREEN}✓ MongoDB indexes created${NC}"

echo -e "${BLUE}Step 3: Verifying MongoDB setup...${NC}"

kubectl exec -n $NAMESPACE $MONGODB_POD -- mongosh --quiet --eval "
db.adminCommand('listDatabases').databases.forEach(function(d) { 
    if (d.name === 'consulting_types') {
        print('Database: ' + d.name + ' (Size: ' + d.sizeOnDisk + ' bytes)');
    }
});
use consulting_types;
print('Collections:');
db.getCollectionNames().forEach(function(col) { print('  - ' + col); });
"

echo -e "${GREEN}✓ MongoDB setup complete!${NC}"
echo ""
echo "MongoDB ClusterIP: 10.43.61.124:27017"
echo ""
echo "Created Database:"
echo "  - consulting_types (no authentication)"
echo ""
echo "Collections:"
echo "  - consultingTypes"
echo "  - topics"
echo "  - topicGroups"

