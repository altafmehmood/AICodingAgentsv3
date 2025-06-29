cl# Azure Cache for Redis with Entra ID - Setup Guide

## ✅ **Fully Implemented** 

Azure Cache for Redis with Entra ID authentication is now fully implemented and working for both production and local development!

## 🔧 **Current Configuration**

### Production & Development
```json
{
  "Redis": {
    "ConnectionString": "akhs.redis.cache.windows.net:6380,ssl=True,abortConnect=False",
    "CacheExpirationHours": 24,
    "InstanceName": "BreachViewerCache",
    "DefaultDatabase": 0,
    "ConnectTimeout": 5000,
    "ConnectRetry": 3,
    "SyncTimeout": 5000,
    "UseEntraId": true
  }
}
```

## 🚀 **Features Implemented**

### ✅ **Automatic Token Refresh**
- Tokens are automatically refreshed every 30 minutes
- 5-minute buffer before expiration to prevent auth failures
- Cached tokens for better performance

### ✅ **Connection Management**
- Persistent connection with automatic reconnection
- Thread-safe connection handling
- Graceful degradation if Redis is unavailable

### ✅ **Health Monitoring**
- Custom health checks for Entra ID Redis
- Latency monitoring (marks as degraded if >1 second)
- Available at `/health` endpoint

### ✅ **Development-Friendly**
- Works with local development using Azure CLI authentication
- Supports multiple authentication methods via `DefaultAzureCredential`
- Detailed logging for troubleshooting

## 🛠 **Setup Instructions**

### 1. Azure Cache for Redis Configuration

1. **Enable Entra ID Authentication:**
   ```bash
   # Navigate to your Redis instance in Azure Portal
   # Go to Authentication → Enable Microsoft Entra Authentication
   ```

2. **Assign Required Roles:**
   ```bash
   # For your user account (local development)
   az role assignment create \
     --role "Redis Cache Data Owner" \
     --assignee your-email@domain.com \
     --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Cache/Redis/{redis-name}

   # For managed identity (production)
   az role assignment create \
     --role "Redis Cache Data Owner" \
     --assignee-object-id {managed-identity-object-id} \
     --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Cache/Redis/{redis-name}
   ```

### 2. Local Development Setup

Choose one of these authentication methods:

#### Option A: Azure CLI (Recommended)
```bash
az login
az account set --subscription "your-subscription-id"
```

#### Option B: Environment Variables
```bash
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"  
export AZURE_TENANT_ID="your-tenant-id"
```

#### Option C: Visual Studio Authentication
- Sign in to Visual Studio with your Azure account
- Ensure the account has Redis access permissions

### 3. Production Deployment

#### Using Managed Identity (Recommended)
1. **Enable Managed Identity on your App Service:**
   ```bash
   az webapp identity assign --name your-app-name --resource-group your-rg
   ```

2. **Assign Redis Role to Managed Identity:**
   ```bash
   # Get the managed identity principal ID
   PRINCIPAL_ID=$(az webapp identity show --name your-app-name --resource-group your-rg --query principalId -o tsv)
   
   # Assign Redis role
   az role assignment create \
     --role "Redis Cache Data Owner" \
     --assignee-object-id $PRINCIPAL_ID \
     --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Cache/Redis/{redis-name}
   ```

#### Using Service Principal
Set these environment variables in your App Service:
```
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_CLIENT_SECRET=your-service-principal-secret
AZURE_TENANT_ID=your-tenant-id
```

## 📊 **Monitoring & Health Checks**

### Health Check Endpoint
```bash
curl https://your-app-url/health
```

**Example Response:**
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "redis-entra",
      "status": "Healthy",
      "duration": "00:00:00.0234567"
    }
  ],
  "duration": "00:00:00.0345678"
}
```

### Application Logs
Monitor these log messages:

**Successful Connection:**
```
info: BreachApi.Services.EntraIdRedisConnectionFactory[0]
      Successfully connected to Redis with Entra ID authentication

info: Program[0]
      Configured Azure Cache for Redis with Entra ID authentication
```

**Token Refresh:**
```
debug: BreachApi.Services.EntraIdRedisConnectionFactory[0]
       Redis token refreshed successfully
```

**Cache Operations:**
```
debug: BreachApi.Services.EntraIdRedisCache[0]
       Cache hit for key: ai_risk_summary_BreachName
       
debug: BreachApi.Services.EntraIdRedisCache[0] 
       Cached value for key: ai_risk_summary_BreachName, expires in: 24:00:00
```

## 🔍 **Troubleshooting**

### Common Issues

#### 1. **Authentication Failed**
```
error: Failed to obtain Redis token from Entra ID
```
**Solution:** Verify role assignments and authentication method

#### 2. **Connection Timeout**  
```
warn: Failed to get cache value for key: ai_risk_summary_*
```
**Solution:** Check network connectivity and firewall rules

#### 3. **Token Expired**
```
debug: Requesting new Redis token from Entra ID
```
**This is normal** - tokens are automatically refreshed

### Debug Logging

Enable detailed logging in `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "BreachApi.Services.EntraIdRedisConnectionFactory": "Debug",
      "BreachApi.Services.EntraIdRedisCache": "Debug",
      "StackExchange.Redis": "Information"
    }
  }
}
```

### Verify Permissions
```bash
# Check your current Azure account
az account show

# List role assignments for Redis resource
az role assignment list --scope /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Cache/Redis/{redis-name}
```

## 🎯 **Cache Usage**

The AI Risk Analysis service automatically uses Redis:

- **Cache Keys:** `BreachViewerCache:ai_risk_summary_{breachName}`
- **Expiration:** 24 hours (configurable)
- **Sliding Expiration:** Refreshes if accessed within 6 hours of expiry
- **Graceful Degradation:** Continues working if Redis is unavailable

## 📈 **Performance Benefits**

- **Faster AI Analysis:** Cached responses load instantly
- **Reduced API Costs:** Fewer calls to Claude API
- **Better User Experience:** No waiting for repeated analyses
- **Scalable:** Shared cache across multiple application instances

## ✅ **Success Checklist**

- [ ] Azure Cache for Redis has Entra ID enabled
- [ ] Appropriate roles assigned (Redis Cache Data Owner)
- [ ] Local development authenticated (az login or env vars)
- [ ] Application starts without Redis errors
- [ ] Health check shows Redis as healthy
- [ ] AI Risk Analysis creates and retrieves cached data

Your Redis with Entra ID authentication is now fully operational! 🎉 