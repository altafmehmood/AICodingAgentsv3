# Redis Configuration - Current State

## Current Status: ⚠️ In-Memory Cache (Fallback)

The application is currently configured to use **in-memory distributed cache** as a fallback while Redis configuration is being finalized.

## Why In-Memory Cache?

The Entra ID authentication for Azure Cache for Redis requires a more complex token refresh mechanism that needs to be implemented properly. For now, the application uses in-memory caching to ensure the AI Risk Analysis feature continues to work.

## Current Configuration (appsettings.json)

```json
{
  "Redis": {
    "ConnectionString": "",
    "CacheExpirationHours": 24,
    "InstanceName": "BreachViewerCache",
    "DefaultDatabase": 0,
    "ConnectTimeout": 5000,
    "ConnectRetry": 3,
    "SyncTimeout": 5000,
    "UseEntraId": false,
    "TenantId": "",
    "ClientId": ""
  }
}
```

## Options to Enable Redis

### Option 1: Use Redis Access Key (Quick Setup)

If you want to use Redis immediately with access keys:

1. **Get Redis Access Key from Azure Portal:**
   - Navigate to your Azure Cache for Redis instance
   - Go to **Access keys** under **Settings**
   - Copy the **Primary connection string**

2. **Update appsettings.json:**
   ```json
   {
     "Redis": {
       "ConnectionString": "akhs.redis.cache.windows.net:6380,password=YOUR_ACCESS_KEY_HERE,ssl=True,abortConnect=False",
       "UseEntraId": false
     }
   }
   ```

### Option 2: Wait for Entra ID Implementation

The Entra ID authentication is prepared but requires a proper token refresh mechanism. This will be implemented in a future update.

### Option 3: Use Local Redis for Development

For local development, you can run Redis locally:

1. **Install Redis locally:**
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Windows (using Docker)
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **Update appsettings.Development.json:**
   ```json
   {
     "Redis": {
       "ConnectionString": "localhost:6379",
       "UseEntraId": false,
       "CacheExpirationHours": 1
     }
   }
   ```

## Impact of In-Memory Cache

### ✅ What Works:
- AI Risk Analysis caching functions normally
- No performance impact for single-instance deployments
- No external dependencies

### ⚠️ Limitations:
- Cache is lost when application restarts
- No shared cache across multiple application instances
- Higher memory usage on the application server

## Monitoring Cache Status

Check the application logs on startup to see which caching method is being used:

```
info: Program[0]
      Redis connection string not found. Using in-memory distributed cache as fallback.
```

Or if Redis is configured:

```
info: Program[0]
      Configured Azure Cache for Redis with connection string: akhs.redis.cache.windows.net...
```

## Health Checks

The `/health` endpoint will show the current caching configuration:

- **In-memory cache**: No cache-specific health checks
- **Redis configured**: Will include Redis connectivity checks

## Next Steps

1. **Immediate**: Use Option 1 (access keys) if you need distributed caching now
2. **Future**: Entra ID authentication will be fully implemented with proper token refresh
3. **Development**: Use Option 3 (local Redis) for development and testing

## Questions?

The current in-memory cache setup ensures the application continues to work while we finalize the Redis configuration. Choose the option that best fits your current needs. 