# MariaDB Databases

## Overview
MariaDB stores relational data for all Online Beratung services.

## Connection Details
- **ClusterIP:** `10.43.123.72:3306`
- **Pod Name:** `mariadb-0`
- **Root Password:** `root`

## Databases

### 1. agencyservice
**Purpose:** Stores counseling agency data

**User:** `agencyservice` / `agencyservice`

**Tables:**
- `agency` - Agency master data
- `dioceses` - Diocese information
- `age` - Age range configurations
- `consultant_agency` - Consultant-agency relationships
- And more...

**Schema Location:** `mariadb/agencyservice/schema.sql`

---

### 2. consultingtypeservice
**Purpose:** Stores consulting type metadata and relationships

**User:** `consultingtypeservice` / `consultingtypeservice`

**Tables:**
- `tenant` - Multi-tenancy configuration
- `application_settings` - Application settings
- `DATABASECHANGELOGLOCK` - Liquibase lock table (not used, Liquibase disabled)

**Schema Location:** `mariadb/consultingtypeservice/schema.sql`

**Note:** Main consulting type data is stored in MongoDB, not MariaDB.

---

### 3. tenantservice
**Purpose:** Stores tenant configuration for multi-tenancy

**User:** `tenantservice` / `tenantservice`

**Tables:**
- `tenant` - Tenant master data
- `tenant_admin` - Tenant administrators
- `settings` - Tenant-specific settings
- And more...

**Schema Location:** `mariadb/tenantservice/schema.sql`

---

### 4. userservice
**Purpose:** Stores user, consultant, and asker information

**User:** `userservice` / `userservice`

**Tables:**
- `user` - User master data
- `consultant` - Consultant profiles
- `user_agency` - User-agency relationships
- `session` - Counseling sessions
- `user_session` - User-session relationships
- `chat` - Chat/group sessions
- `rocket_chat_credentials` - Legacy chat credentials
- And many more...

**Schema Location:** `mariadb/userservice/schema.sql`

**Note:** This is the largest and most complex database.

---

### 5. videoservice
**Purpose:** Stores video call session data

**User:** `videoservice` / `videoservice`

**Tables:**
- `video_credentials` - Jitsi call credentials
- `appointment` - Scheduled video appointments
- And more...

**Schema Location:** `mariadb/videoservice/schema.sql`

---

### 6. uploadservice
**Purpose:** Stores file upload metadata

**User:** `uploadservice` / `uploadservice`

**Tables:**
- `uploads` - File upload records

**Schema Location:** `mariadb/uploadservice/schema.sql`

---

### 7. caritas
**Purpose:** General/shared database

**User:** `caritas` / `caritas`

**Schema Location:** `mariadb/caritas/schema.sql`

## Common Operations

### Connect to MariaDB
```bash
kubectl exec -it -n caritas mariadb-0 -- mysql -u root -proot
```

### List All Databases
```bash
kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "SHOW DATABASES;"
```

### Check Table Count
```bash
kubectl exec -n caritas mariadb-0 -- mysql -u root -proot -e "
SELECT 
    TABLE_SCHEMA as 'Database',
    COUNT(*) as 'Tables'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA LIKE '%service%' OR TABLE_SCHEMA = 'caritas'
GROUP BY TABLE_SCHEMA;
"
```

### Export Single Database
```bash
kubectl exec -n caritas mariadb-0 -- mysqldump -u root -proot --no-data agencyservice > agencyservice-schema.sql
```

### Import Single Database
```bash
kubectl exec -i -n caritas mariadb-0 -- mysql -u root -proot agencyservice < agencyservice-schema.sql
```

## Liquibase Status
⚠️ **Liquibase is DISABLED in all services**

All services have `spring.liquibase.enabled=false` in their `application-local.properties`.

Database schemas are managed manually through this repository, not through Liquibase auto-migrations.

## Backup
Use the backup script:
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/backup/backup-mariadb.sh
```

## Restore
Use the restore script:
```bash
cd /home/caritas/Desktop/online-beratung/caritas-workspace/ORISO-Database
./scripts/restore/restore-mariadb.sh /path/to/backup
```

