# ORISO Database

## Overview
Centralized database repository for the entire Online Beratung platform. This repository contains all database schemas, setup scripts, backup/restore utilities, and comprehensive documentation.

## Purpose
All backend services (TenantService, UserService, AgencyService, ConsultingTypeService) have **Liquibase DISABLED**. Database schemas are managed here separately to:
- ✅ Avoid auto-migrations during service startup
- ✅ Maintain clean separation of concerns
- ✅ Enable version-controlled schema management
- ✅ Provide a single source of truth for database structure
- ✅ Facilitate new server deployments

## Database Technologies

### 1. MariaDB (Relational Database)
**ClusterIP:** `10.43.123.72:3306`

**Databases:** 7 databases
- `agencyservice` - Agency data
- `consultingtypeservice` - Consulting type metadata
- `tenantservice` - Multi-tenancy configuration
- `userservice` - Users, consultants, sessions
- `videoservice` - Video call data
- `uploadservice` - File upload metadata
- `caritas` - General/shared data

**Documentation:** [mariadb/README.md](mariadb/README.md)

---

### 2. MongoDB (Document Database)
**ClusterIP:** `10.43.61.124:27017`

**Databases:**
- `consulting_types` - Consulting type JSON documents

**Collections:**
- `consultingTypes` - Consulting type configurations
- `topics` - Topic/subject data
- `topicGroups` - Topic groupings

**Documentation:** [mongodb/README.md](mongodb/README.md)

---

### 3. PostgreSQL (Matrix Synapse Only)
**ClusterIP:** `10.43.140.77:5432`

**Purpose:** Dedicated to Matrix Synapse (real-time communication)

**Database:** `synapse`

⚠️ **Do NOT use for other services** - Managed entirely by Matrix Synapse

**Documentation:** [postgresql/README.md](postgresql/README.md)

---

### 4. Redis (Caching & Sessions)
**ClusterIP:** `10.43.113.3:6379`

**Purpose:** 
- Session storage
- Caching
- Temporary data

**Schema:** Schema-less (key-value store)

**Documentation:** [redis/README.md](redis/README.md)

---

### 5. RabbitMQ (Message Broker)
**ClusterIP:** `10.43.157.60:5672`  
**Management UI:** `:15672`

**Purpose:**
- Async messaging between services
- Email queue
- Event notifications

**Schema:** Schema-less (queues created automatically)

**Documentation:** [rabbitmq/README.md](rabbitmq/README.md)

## Quick Start

### New Server Setup (Complete)
Run the master setup script to initialize ALL databases:

```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/setup/00-master-setup.sh
```

This will:
1. Create all MariaDB databases and users
2. Apply all MariaDB schemas
3. Initialize MongoDB collections
4. Verify Redis connection
5. Verify RabbitMQ connection

### Individual Database Setup

```bash
# MariaDB only
./scripts/setup/01-mariadb-setup.sh
./scripts/setup/02-apply-mariadb-schemas.sh

# MongoDB only
./scripts/setup/03-mongodb-setup.sh

# Redis verification
./scripts/setup/04-redis-setup.sh

# RabbitMQ verification
./scripts/setup/05-rabbitmq-setup.sh
```

## Backup & Restore

### Complete Backup (All Databases)
```bash
./scripts/backup/backup-all.sh [backup-directory]
```

### Individual Backups
```bash
# MariaDB
./scripts/backup/backup-mariadb.sh [backup-directory]

# MongoDB
./scripts/backup/backup-mongodb.sh [backup-directory]
```

### Restore
```bash
# MariaDB
./scripts/restore/restore-mariadb.sh /path/to/backup

# MongoDB
./scripts/restore/restore-mongodb.sh /path/to/backup
```

## Directory Structure

```
ORISO-Database/
├── README.md                    # This file
├── mariadb/                     # MariaDB schemas
│   ├── README.md
│   ├── agencyservice/
│   │   └── schema.sql          # Exported schema
│   ├── consultingtypeservice/
│   │   └── schema.sql
│   ├── tenantservice/
│   │   └── schema.sql
│   ├── userservice/
│   │   └── schema.sql
│   ├── videoservice/
│   │   └── schema.sql
│   ├── uploadservice/
│   │   └── schema.sql
│   └── caritas/
│       └── schema.sql
├── mongodb/                     # MongoDB schemas
│   ├── README.md
│   └── consulting_types/
│       ├── collections.txt
│       └── schema.json
├── postgresql/                  # PostgreSQL (Matrix)
│   ├── README.md
│   └── matrix/
│       └── tables.txt
├── redis/                       # Redis documentation
│   └── README.md
├── rabbitmq/                    # RabbitMQ documentation
│   └── README.md
└── scripts/
    ├── setup/                   # Database initialization
    │   ├── 00-master-setup.sh  # Run all setup scripts
    │   ├── 01-mariadb-setup.sh
    │   ├── 02-apply-mariadb-schemas.sh
    │   ├── 03-mongodb-setup.sh
    │   ├── 04-redis-setup.sh
    │   └── 05-rabbitmq-setup.sh
    ├── backup/                  # Backup utilities
    │   ├── backup-all.sh        # Backup everything
    │   ├── backup-mariadb.sh
    │   └── backup-mongodb.sh
    └── restore/                 # Restore utilities
        ├── restore-mariadb.sh
        └── restore-mongodb.sh
```

## Schema Management Philosophy

### ⚠️ Liquibase is DISABLED
All ORISO backend services have:
```properties
spring.liquibase.enabled=false
```

This means:
- ❌ Services will NOT automatically create/modify schemas
- ✅ All schema changes must be applied manually
- ✅ Schemas are version-controlled in this repository
- ✅ Services are decoupled from schema management
- ✅ Prevents accidental schema modifications

### Making Schema Changes
1. Apply changes manually to the running database
2. Test thoroughly with running services
3. Export updated schema from the database
4. Update schema file in this repository
5. Document the changes
6. Commit to version control

## Exporting Schemas

### MariaDB Schema Export
```bash
# Export all schemas
for db in agencyservice consultingtypeservice tenantservice userservice videoservice uploadservice caritas; do
  kubectl exec -n caritas mariadb-0 -- mysqldump -u root -proot --no-data --skip-add-drop-table $db > mariadb/$db/schema.sql
done
```

### MongoDB Schema Export
```bash
POD=$(kubectl get pods -n caritas -l app=mongodb -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n caritas $POD -- mongodump --db=consulting_types --out=/tmp/backup
kubectl cp caritas/$POD:/tmp/backup ./mongodb/
```

## Verification

### Check All Databases are Running
```bash
kubectl get pods -n caritas | grep -E "mariadb|mongo|postgres|redis|rabbit"
```

### Verify Services Can Connect
```bash
# Check service health endpoints
curl http://localhost:8081/actuator/health  # TenantService
curl http://localhost:8082/actuator/health  # UserService
curl http://localhost:8084/actuator/health  # AgencyService
curl http://localhost:8083/actuator/health  # ConsultingTypeService
```

### Database Connection Summary
```bash
# MariaDB
kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "SHOW DATABASES;"

# MongoDB
POD=$(kubectl get pods -n caritas -l app=mongodb -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- mongosh --quiet --eval "db.adminCommand('listDatabases')"

# PostgreSQL
kubectl exec -n caritas matrix-postgres-0 -- psql -U synapse_user -l

# Redis
POD=$(kubectl get pods -n caritas -l app=redis -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- redis-cli DBSIZE

# RabbitMQ
POD=$(kubectl get pods -n caritas -l app=rabbitmq -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- rabbitmqctl list_queues
```

## Important Notes

### Service Configuration
All ORISO services are configured to use ClusterIPs (NOT localhost):
- **MariaDB:** `10.43.123.72:3306`
- **MongoDB:** `10.43.61.124:27017`
- **Redis:** `10.43.113.3:6379`
- **RabbitMQ:** `10.43.157.60:5672`

However, with `hostNetwork: true` in Kubernetes, services use `localhost`.

### First-Time Server Setup Checklist
- [ ] Deploy MariaDB, MongoDB, Redis, RabbitMQ, PostgreSQL pods
- [ ] Wait for all pods to be Running
- [ ] Run `./scripts/setup/00-master-setup.sh`
- [ ] Verify all databases are created
- [ ] Deploy backend services with Liquibase DISABLED
- [ ] Check service health endpoints
- [ ] Verify services can connect to databases

### Maintenance
- **Backups:** Run regularly using `backup-all.sh`
- **Schema Updates:** Always test on staging first
- **Monitoring:** Check database sizes and performance
- **Cleanup:** Periodically review and clean old data

## Troubleshooting

### Service Can't Connect to Database
1. Check pod is running: `kubectl get pods -n caritas | grep <database>`
2. Verify ClusterIP: `kubectl get svc -n caritas <database>`
3. Check service logs: `kubectl logs -n caritas -l app=<service>`
4. Verify credentials in service config

### Liquibase Error on Service Startup
If you see Liquibase errors, ensure `spring.liquibase.enabled=false` in:
- `ORISO-TenantService/src/main/resources/application-local.properties`
- `ORISO-UserService/src/main/resources/application-local.properties`
- `ORISO-AgencyService/src/main/resources/application-local.properties`
- `ORISO-ConsultingTypeService/src/main/resources/application-local.properties`

### Schema Not Applied
Run the apply script:
```bash
./scripts/setup/02-apply-mariadb-schemas.sh
```

### Database Connection Refused
Check if using correct ClusterIP and port. With `hostNetwork: true`, services use `localhost`.

## References
- **Service READMEs:** `../ORISO-*/README.md`
- **Kubernetes Deployments:** `../../kubernetes-complete/`
- **Database Documentation:** Individual database README files in subdirectories

## Support
For issues or questions about database setup, check:
1. Individual database README files
2. Service-specific README files in ORISO-* directories
3. Kubernetes deployment configurations
4. Service logs and health endpoints
