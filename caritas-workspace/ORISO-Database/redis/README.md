# Redis Configuration

## Overview
Redis is used for caching and session storage across Online Beratung services.

## Connection Details
- **ClusterIP:** `10.43.113.3:6379`
- **Pod Name:** Check with `kubectl get pods -n caritas -l app=redis`
- **Password:** Check your deployment configuration
- **Persistence:** Enabled via PersistentVolume

## Purpose
Redis serves as:
1. **Session Store** - User sessions and authentication tokens
2. **Cache** - Frequently accessed data (agencies, consulting types, etc.)
3. **Temporary Storage** - Short-lived data and rate limiting

## Data Structure
Redis is key-value based and schema-less. Data is organized using key prefixes:

### Common Key Patterns
- `spring:session:*` - Spring session data
- `cache:*` - Cached data from services
- `token:*` - Authentication tokens
- `rate-limit:*` - Rate limiting counters

## Common Operations

### Connect to Redis
```bash
POD=$(kubectl get pods -n caritas -l app=redis -o name | head -1 | cut -d/ -f2)
kubectl exec -it -n caritas $POD -- redis-cli
```

### Check Redis Status
```bash
POD=$(kubectl get pods -n caritas -l app=redis -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- redis-cli ping
```

### Get Redis Info
```bash
POD=$(kubectl get pods -n caritas -l app=redis -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- redis-cli INFO
```

### List All Keys (be careful in production!)
```bash
kubectl exec -n caritas $POD -- redis-cli KEYS '*'
```

### Get Key Count
```bash
kubectl exec -n caritas $POD -- redis-cli DBSIZE
```

### Monitor Redis Commands (real-time)
```bash
kubectl exec -n caritas $POD -- redis-cli MONITOR
```

### Flush All Data (⚠️ DANGER - deletes everything!)
```bash
kubectl exec -n caritas $POD -- redis-cli FLUSHALL
```

## Redis Commander (Web UI)
Redis Commander provides a web interface for Redis:

- **URL:** Check service port mapping
- **Access:** Via kubectl port-forward

```bash
kubectl port-forward -n caritas svc/redis-commander 9021:9021
# Open http://localhost:9021
```

## Configuration
Redis is configured for:
- **Max Memory:** Set in deployment
- **Eviction Policy:** Usually `allkeys-lru` (Least Recently Used)
- **Persistence:** RDB snapshots + AOF log
- **Password:** Set via Kubernetes secret

## Backup
Redis data is automatically persisted to disk via:
1. **RDB Snapshots** - Periodic full snapshots
2. **AOF (Append Only File)** - Transaction log

These are stored in the PersistentVolume and backed up with Kubernetes volume backups.

## Manual Backup
```bash
# Trigger immediate save
POD=$(kubectl get pods -n caritas -l app=redis -o name | head -1 | cut -d/ -f2)
kubectl exec -n caritas $POD -- redis-cli BGSAVE

# Check last save time
kubectl exec -n caritas $POD -- redis-cli LASTSAVE
```

## Important Notes
1. **No Schema Required** - Redis is schema-less
2. **Data is Volatile** - Use for caching, not primary storage
3. **Session Storage** - Clearing Redis will log out all users
4. **No Setup Needed** - Redis works out of the box
5. **Memory Limit** - Configure based on your needs

## Troubleshooting

### Service Can't Connect
1. Check Redis pod is running: `kubectl get pods -n caritas | grep redis`
2. Verify ClusterIP: `kubectl get svc -n caritas redis`
3. Test connection from another pod

### Memory Issues
```bash
# Check memory usage
kubectl exec -n caritas $POD -- redis-cli INFO memory
```

### Clear Cache
```bash
# Clear cache keys only (preserve sessions)
kubectl exec -n caritas $POD -- redis-cli --scan --pattern 'cache:*' | xargs redis-cli DEL
```

