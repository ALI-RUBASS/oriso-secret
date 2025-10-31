# ORISO Database - Complete Setup Guide

## 🎯 Quick Start (New Server)

To set up ALL databases on a new server, run ONE command:

```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/setup/00-master-setup.sh
```

This will automatically:
1. ✅ Create all MariaDB databases (agencyservice, userservice, tenantservice, etc.)
2. ✅ Create all MariaDB users with proper permissions
3. ✅ Apply all MariaDB schemas
4. ✅ Initialize MongoDB (consulting_types database)
5. ✅ Verify Redis is running
6. ✅ Verify RabbitMQ is running

**Total Time:** ~2-3 minutes

## 📋 What Gets Set Up

### MariaDB (7 Databases)
| Database | Port | User | ClusterIP |
|----------|------|------|-----------|
| agencyservice | 3306 | agencyservice/agencyservice | 10.43.123.72 |
| consultingtypeservice | 3306 | consultingtypeservice/consultingtypeservice | 10.43.123.72 |
| tenantservice | 3306 | tenantservice/tenantservice | 10.43.123.72 |
| userservice | 3306 | userservice/userservice | 10.43.123.72 |
| videoservice | 3306 | videoservice/videoservice | 10.43.123.72 |
| uploadservice | 3306 | uploadservice/uploadservice | 10.43.123.72 |
| caritas | 3306 | caritas/caritas | 10.43.123.72 |

### MongoDB
| Database | Collections | ClusterIP |
|----------|-------------|-----------|
| consulting_types | consultingTypes, topics, topicGroups | 10.43.61.124:27017 |

### Redis
| Purpose | ClusterIP |
|---------|-----------|
| Caching & Sessions | 10.43.113.3:6379 |

### RabbitMQ
| Purpose | ClusterIP |
|---------|-----------|
| Message Broker | 10.43.157.60:5672 |

### PostgreSQL (Matrix Only)
| Database | ClusterIP |
|----------|-----------|
| synapse (Matrix) | 10.43.140.77:5432 |

## 🚀 Deployment Workflow

### Step 1: Deploy Infrastructure
```bash
# Deploy Kubernetes infrastructure (if not already done)
kubectl apply -f /home/caritas/Desktop/online-beratung/kubernetes-complete/
```

### Step 2: Wait for Pods
```bash
# Wait for all database pods to be Running
kubectl get pods -n caritas | grep -E "mariadb|mongo|redis|rabbit"
```

### Step 3: Run Database Setup
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/setup/00-master-setup.sh
```

### Step 4: Verify Databases
```bash
# Check MariaDB
kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "SHOW DATABASES;"

# Check MongoDB
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- mongosh --quiet --eval "db.adminCommand('listDatabases')"
```

### Step 5: Deploy Backend Services
```bash
# Deploy ORISO services (with Liquibase DISABLED)
kubectl apply -f /home/caritas/Desktop/online-beratung/kubernetes-complete/04-backend-services-fixed.yaml
```

### Step 6: Verify Services
```bash
# Check all pods are running
kubectl get pods -n caritas

# Check service health
curl http://localhost:8081/actuator/health  # TenantService
curl http://localhost:8082/actuator/health  # UserService
curl http://localhost:8084/actuator/health  # AgencyService
curl http://localhost:8083/actuator/health  # ConsultingTypeService
```

## 🔧 Individual Database Setup

If you need to set up databases individually:

### MariaDB Only
```bash
./scripts/setup/01-mariadb-setup.sh        # Create databases & users
./scripts/setup/02-apply-mariadb-schemas.sh  # Apply schemas
```

### MongoDB Only
```bash
./scripts/setup/03-mongodb-setup.sh
```

### Redis Verification
```bash
./scripts/setup/04-redis-setup.sh
```

### RabbitMQ Verification
```bash
./scripts/setup/05-rabbitmq-setup.sh
```

## 💾 Backup & Restore

### Create Complete Backup
```bash
# Backup everything to /tmp/online-beratung-backup
./scripts/backup/backup-all.sh

# Or specify custom directory
./scripts/backup/backup-all.sh /path/to/backup
```

### Create Individual Backups
```bash
# MariaDB only
./scripts/backup/backup-mariadb.sh /path/to/backup

# MongoDB only
./scripts/backup/backup-mongodb.sh /path/to/backup
```

### Restore from Backup
```bash
# Restore MariaDB
./scripts/restore/restore-mariadb.sh /path/to/backup/timestamp/mariadb

# Restore MongoDB
./scripts/restore/restore-mongodb.sh /path/to/backup/timestamp/mongodb/mongodb-backup
```

## 📚 Documentation

Detailed documentation for each database:
- **MariaDB:** [mariadb/README.md](mariadb/README.md)
- **MongoDB:** [mongodb/README.md](mongodb/README.md)
- **PostgreSQL:** [postgresql/README.md](postgresql/README.md)
- **Redis:** [redis/README.md](redis/README.md)
- **RabbitMQ:** [rabbitmq/README.md](rabbitmq/README.md)

## ⚠️ Important Notes

### Liquibase is DISABLED
All ORISO services have `spring.liquibase.enabled=false`. This means:
- ❌ Services will NOT auto-create schemas
- ✅ All schemas must be set up using this repository
- ✅ Schema changes are version-controlled
- ✅ No accidental database modifications

### Service Configuration
All services are configured to use:
- **MariaDB:** `10.43.123.72:3306` (or `localhost` with hostNetwork)
- **MongoDB:** `10.43.61.124:27017` (or `localhost` with hostNetwork)
- **Redis:** `10.43.113.3:6379`
- **RabbitMQ:** `10.43.157.60:5672`

### No Manual Schema Changes
DO NOT manually modify schemas outside of this repository. Always:
1. Make changes via scripts in this repository
2. Test thoroughly
3. Export updated schemas
4. Commit to version control

## 🔍 Verification Commands

```bash
# Check all database pods
kubectl get pods -n caritas | grep -E "mariadb|mongo|redis|rabbit|postgres"

# Verify MariaDB databases
kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "SHOW DATABASES LIKE '%service%';"

# Verify MongoDB collections
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- mongosh --quiet --eval "use consulting_types; db.getCollectionNames()"

# Check service health
for port in 8081 8082 8083 8084; do
  echo "Port $port: $(curl -s http://localhost:$port/actuator/health | jq -r .status 2>/dev/null || echo 'DOWN')"
done
```

## 🆘 Troubleshooting

### Pod Not Running
```bash
kubectl describe pod <pod-name> -n caritas
kubectl logs <pod-name> -n caritas
```

### Service Can't Connect
1. Check database pod is Running
2. Verify ClusterIP: `kubectl get svc -n caritas`
3. Check service logs
4. Verify configuration in `application-local.properties`

### Schema Not Applied
```bash
# Re-run schema application
./scripts/setup/02-apply-mariadb-schemas.sh
```

### Liquibase Error
Verify Liquibase is disabled:
```bash
grep "spring.liquibase.enabled" /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-*/src/main/resources/application-local.properties
```
Should show `spring.liquibase.enabled=false` for all services.

## 📞 Quick Reference

| Component | Port | Pod | ClusterIP |
|-----------|------|-----|-----------|
| MariaDB | 3306 | mariadb-0 | 10.43.123.72 |
| MongoDB | 27017 | Check with kubectl | 10.43.61.124 |
| PostgreSQL | 5432 | matrix-postgres-0 | 10.43.140.77 |
| Redis | 6379 | Check with kubectl | 10.43.113.3 |
| RabbitMQ | 5672 | Check with kubectl | 10.43.157.60 |
| RabbitMQ Mgmt | 15672 | Check with kubectl | 10.43.157.60 |

## ✅ Final Checklist

After running setup, verify:
- [ ] All database pods are Running
- [ ] All MariaDB databases exist
- [ ] All MariaDB users can connect
- [ ] MongoDB consulting_types database exists
- [ ] Redis responds to PING
- [ ] RabbitMQ management UI accessible
- [ ] All backend services are Running
- [ ] All service health endpoints return UP
- [ ] Liquibase is disabled in all services

**Your database setup is complete!** 🎉

