# PostgreSQL (Matrix Synapse)

## Overview
PostgreSQL is used exclusively by Matrix Synapse for storing real-time communication data.

## Connection Details
- **ClusterIP:** `10.43.140.77:5432`
- **Pod Name:** `matrix-postgres-0`
- **Database:** `synapse`
- **User:** `synapse_user`
- **Password:** Check Matrix Synapse configuration

## Purpose
This PostgreSQL instance is dedicated to Matrix Synapse and stores:
- **User accounts** - Matrix user registrations
- **Rooms** - Chat rooms and groups
- **Messages** - Message history
- **Events** - Matrix protocol events
- **Media** - File metadata (actual files stored separately)
- **Presence** - User online/offline status
- **Device info** - User devices for encryption

## Important Notes
⚠️ **This database is ONLY for Matrix Synapse**
- Do NOT use for other services
- Do NOT modify manually
- Managed entirely by Matrix Synapse
- Schema is complex and Matrix-specific

## Common Operations

### Connect to PostgreSQL
```bash
kubectl exec -it -n caritas matrix-postgres-0 -- psql -U synapse_user -d synapse
```

### List Tables
```sql
\dt
```

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('synapse'));
```

### List Largest Tables
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Count Users
```sql
SELECT COUNT(*) FROM users;
```

### Count Rooms
```sql
SELECT COUNT(*) FROM rooms;
```

### Count Messages
```sql
SELECT COUNT(*) FROM events WHERE type = 'm.room.message';
```

## Backup
Matrix Synapse database should be backed up separately from other services.

### Manual Backup
```bash
kubectl exec -n caritas matrix-postgres-0 -- pg_dump -U synapse_user synapse > matrix-synapse-backup.sql
```

### Restore
```bash
kubectl exec -i -n caritas matrix-postgres-0 -- psql -U synapse_user synapse < matrix-synapse-backup.sql
```

## Integration with Online Beratung
Matrix Synapse integrates with Online Beratung services via:
1. **Matrix JS SDK** - Frontend connects directly to Matrix
2. **Matrix REST API** - Backend services interact via HTTP API
3. **Shared Authentication** - Synced with Keycloak

## Schema Management
- **Managed by Matrix Synapse** - Not by Online Beratung services
- **Auto-Migration** - Synapse handles schema upgrades
- **Do NOT Use Liquibase** - This is a Matrix database, not a Caritas service

## Maintenance

### Vacuum Database (clean up)
```bash
kubectl exec -n caritas matrix-postgres-0 -- psql -U synapse_user -d synapse -c "VACUUM ANALYZE;"
```

### Reindex
```bash
kubectl exec -n caritas matrix-postgres-0 -- psql -U synapse_user -d synapse -c "REINDEX DATABASE synapse;"
```

## Monitoring

### Active Connections
```sql
SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'synapse';
```

### Slow Queries
```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
```

## Important Warnings
1. ⚠️ **Do NOT delete data manually** - Will break Matrix functionality
2. ⚠️ **Do NOT modify schema** - Synapse expects specific structure
3. ⚠️ **Do NOT use for other services** - Dedicated to Matrix only
4. ⚠️ **Always backup before Synapse upgrades** - Schema may change
5. ⚠️ **Large database** - Can grow very large with message history

## For New Server Setup
This database is created and managed by Matrix Synapse during initial setup. No manual initialization needed.

1. Deploy PostgreSQL pod
2. Deploy Matrix Synapse
3. Synapse automatically creates schema on first run
4. No further action required

## References
- Matrix Synapse Database: https://matrix-org.github.io/synapse/latest/setup/installation.html
- PostgreSQL Official Docs: https://www.postgresql.org/docs/

