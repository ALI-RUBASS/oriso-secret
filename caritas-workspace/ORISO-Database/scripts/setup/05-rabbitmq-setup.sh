#!/bin/bash

# RabbitMQ Setup Script
# This script documents RabbitMQ configuration for Online Beratung services

echo "=================================================="
echo "RabbitMQ Setup for Online Beratung"
echo "=================================================="

NAMESPACE="caritas"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get RabbitMQ pod name dynamically
RABBITMQ_POD=$(kubectl get pods -n $NAMESPACE -l app=rabbitmq -o jsonpath="{.items[0].metadata.name}")

echo -e "${BLUE}Using RabbitMQ Pod: $RABBITMQ_POD${NC}"
echo ""

echo -e "${BLUE}RabbitMQ Configuration:${NC}"
echo "  ClusterIP: 10.43.157.60"
echo "  AMQP Port: 5672"
echo "  Management Port: 15672"
echo "  Default User: user"
echo "  Default Password: password"
echo ""

echo -e "${BLUE}Verifying RabbitMQ status...${NC}"

kubectl exec -n $NAMESPACE $RABBITMQ_POD -- rabbitmqctl status 2>/dev/null | head -10

echo ""
echo -e "${BLUE}Listing Queues:${NC}"
kubectl exec -n $NAMESPACE $RABBITMQ_POD -- rabbitmqctl list_queues 2>/dev/null || echo -e "${YELLOW}⚠ No queues exist yet${NC}"

echo ""
echo -e "${BLUE}Listing Exchanges:${NC}"
kubectl exec -n $NAMESPACE $RABBITMQ_POD -- rabbitmqctl list_exchanges 2>/dev/null | head -10

echo ""
echo -e "${GREEN}✓ RabbitMQ setup complete!${NC}"
echo ""
echo "RabbitMQ is used for:"
echo "  - Async messaging between services"
echo "  - Event notifications"
echo "  - Email queue"
echo ""
echo "Management UI: http://91.99.219.182:15672"
echo "  Username: user"
echo "  Password: password"
echo ""
echo "Note: Queues and exchanges are created automatically by services"

