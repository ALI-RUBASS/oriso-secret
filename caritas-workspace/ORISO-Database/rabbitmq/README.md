# RabbitMQ Configuration

## Overview
RabbitMQ is the message broker for asynchronous communication between Online Beratung services.

## Connection Details
- **ClusterIP:** `10.43.157.60`
- **AMQP Port:** `5672`
- **Management Port:** `15672`
- **Pod Name:** Check with `kubectl get pods -n caritas -l app=rabbitmq`
- **Default User:** `user`
- **Default Password:** `password`

## Purpose
RabbitMQ handles:
1. **Async Messaging** - Event-driven communication between services
2. **Email Queue** - Email sending tasks
3. **Event Notifications** - System-wide event distribution
4. **Task Queues** - Background job processing

## Architecture

### Exchanges
Exchanges route messages to queues:
- **Direct Exchange** - Routes by exact routing key
- **Topic Exchange** - Routes by pattern matching
- **Fanout Exchange** - Broadcasts to all queues

### Queues
Queues store messages until consumed:
- Created automatically by services
- Durable (survive restarts)
- Can have dead-letter queues for failed messages

### Common Queue Names
- `email.queue` - Email sending tasks
- `notification.queue` - User notifications
- `event.user.created` - User creation events
- `event.session.started` - Session start events

## Common Operations

### Access Management UI
```bash
# Port forward to access web UI
kubectl port-forward -n caritas svc/rabbitmq 15672:15672

# Open http://localhost:15672
# Login: user / password
```

### Connect via CLI
```bash
POD=$(kubectl get pods -n caritas -l app=rabbitmq -o name | head -1 | cut -d/ -f2)
kubectl exec -it -n caritas $POD -- bash
```

### Check RabbitMQ Status
```bash
kubectl exec -n caritas $POD -- rabbitmqctl status
```

### List Queues
```bash
kubectl exec -n caritas $POD -- rabbitmqctl list_queues name messages consumers
```

### List Exchanges
```bash
kubectl exec -n caritas $POD -- rabbitmqctl list_exchanges name type
```

### List Bindings
```bash
kubectl exec -n caritas $POD -- rabbitmqctl list_bindings
```

### List Connections
```bash
kubectl exec -n caritas $POD -- rabbitmqctl list_connections
```

### Purge a Queue (⚠️ deletes all messages!)
```bash
kubectl exec -n caritas $POD -- rabbitmqctl purge_queue <queue-name>
```

## Service Configuration
Services connect to RabbitMQ using:

```properties
# application-local.properties
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=user
spring.rabbitmq.password=password
```

**Note:** With `hostNetwork: true`, services use `localhost` not the ClusterIP.

## Management UI Features
The web UI (http://localhost:15672) provides:
- **Overview** - System health and statistics
- **Queues** - View and manage queues
- **Exchanges** - View and manage exchanges
- **Connections** - Active connections from services
- **Channels** - Communication channels
- **Admin** - User and permission management

## Monitoring

### Queue Health
```bash
# Get detailed queue stats
kubectl exec -n caritas $POD -- rabbitmqctl list_queues name messages messages_ready messages_unacknowledged consumers
```

### Memory Usage
```bash
kubectl exec -n caritas $POD -- rabbitmqctl status | grep -A 10 memory
```

## Backup
RabbitMQ configuration and queue definitions can be exported:

### Export Definitions
```bash
kubectl exec -n caritas $POD -- rabbitmqctl export_definitions /tmp/definitions.json
kubectl cp caritas/$POD:/tmp/definitions.json ./rabbitmq-definitions.json
```

### Import Definitions
```bash
kubectl cp ./rabbitmq-definitions.json caritas/$POD:/tmp/definitions.json
kubectl exec -n caritas $POD -- rabbitmqctl import_definitions /tmp/definitions.json
```

**Note:** Queue messages themselves are not exported. Only definitions (queues, exchanges, bindings).

## Auto-Created Resources
Services automatically create their required queues and exchanges on first connection. No manual setup is needed.

## Troubleshooting

### Service Can't Connect
1. Check RabbitMQ pod: `kubectl get pods -n caritas | grep rabbitmq`
2. Check credentials in service config
3. Verify port 5672 is accessible

### Queue Buildup
If messages are accumulating:
1. Check consumer service is running
2. Check for errors in consumer logs
3. Consider scaling consumer service

### Dead Letter Queues
Failed messages go to dead letter queues:
```bash
kubectl exec -n caritas $POD -- rabbitmqctl list_queues name messages | grep dlq
```

## Important Notes
1. **Auto-Configuration** - Services create their own queues/exchanges
2. **No Schema Required** - RabbitMQ is schema-less
3. **Message Persistence** - Messages survive restarts (durable queues)
4. **No Manual Setup** - Services handle everything automatically
5. **Monitoring** - Use management UI for real-time monitoring

