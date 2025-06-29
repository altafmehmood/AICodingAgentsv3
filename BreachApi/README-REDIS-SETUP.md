# Azure Cache for Redis Setup with Entra ID Authentication

This document outlines how to configure the BreachApi application to use Azure Cache for Redis with Entra ID (Azure AD) authentication.

## Overview

The application supports both traditional Redis authentication (with access keys) and Entra ID authentication for Azure Cache for Redis. Entra ID authentication is more secure as it doesn't require storing access keys and supports managed identities.

## Configuration

### appsettings.json

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
    "UseEntraId": true,
    "TenantId": "",
    "ClientId": ""
  }
}
```

### Configuration Properties

- **ConnectionString**: Redis server endpoint (without password for Entra ID)
- **CacheExpirationHours**: Default cache expiration time in hours
- **InstanceName**: Redis instance name prefix for cache keys
- **DefaultDatabase**: Redis database number to use (default: 0)
- **ConnectTimeout**: Connection timeout in milliseconds
- **ConnectRetry**: Number of connection retries
- **SyncTimeout**: Synchronous operation timeout in milliseconds
- **UseEntraId**: Enable Entra ID authentication (set to `true`)
- **TenantId**: Azure AD tenant ID (optional for DefaultAzureCredential)
- **ClientId**: Application client ID (optional for DefaultAzureCredential)

## Azure Setup

### 1. Enable Entra ID Authentication on Redis Cache

1. In Azure Portal, navigate to your Azure Cache for Redis instance
2. Go to **Authentication** under **Settings**
3. Enable **Microsoft Entra Authentication**
4. Configure the authentication settings

### 2. Assign Redis Data Access Roles

Assign the appropriate roles to your application's managed identity or service principal:

- **Redis Cache Contributor**: Full access to cache operations
- **Redis Cache Data Owner**: Full data access
- **Redis Cache Data Reader**: Read-only data access

### 3. Configure Managed Identity (Recommended)

For production deployments, use a managed identity:

1. Enable **System-assigned managed identity** on your App Service/Container Instance
2. Assign the Redis data access roles to the managed identity
3. No additional configuration needed in appsettings.json

### 4. Configure Service Principal (Development/Testing)

For development or testing with a service principal:

1. Create an Azure AD application registration
2. Create a client secret or certificate
3. Assign Redis data access roles to the service principal
4. Configure authentication in your application

## Authentication Methods

The application uses `DefaultAzureCredential` which tries authentication methods in this order:

1. **Environment Variables** (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
2. **Managed Identity** (recommended for production)
3. **Visual Studio** (for local development)
4. **Azure CLI** (for local development)
5. **Azure PowerShell** (for local development)

## Local Development

### Option 1: Azure CLI Authentication
```bash
az login
az account set --subscription "your-subscription-id"
```

### Option 2: Environment Variables
```bash
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

### Option 3: Local Redis (Fallback)
For local development, you can use a local Redis instance:

```json
{
  "Redis": {
    "ConnectionString": "localhost:6379",
    "UseEntraId": false,
    "CacheExpirationHours": 1,
    "InstanceName": "BreachViewerCache-Dev"
  }
}
```

## Health Checks

The application includes health checks for Redis connectivity:

- **Endpoint**: `/health`
- **Redis Health Check**: Tests connection and latency
- **Tags**: `cache`, `redis`, `entra-id`

Example health check response:
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

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Ensure the managed identity or service principal has the correct Redis roles assigned
2. **Connection Timeout**: Check network connectivity and firewall rules
3. **Token Expired**: The application automatically handles token refresh, but verify the credentials are valid

### Debug Logging

Enable debug logging for Redis operations:

```json
{
  "Logging": {
    "LogLevel": {
      "StackExchange.Redis": "Debug",
      "BreachApi.Services.RedisConfigurationService": "Debug"
    }
  }
}
```

### Testing Redis Connection

Use the health check endpoint to verify Redis connectivity:

```bash
curl https://your-app-url/health
```

## Security Considerations

1. **Use Managed Identity**: Preferred for production environments
2. **Network Security**: Configure Redis firewall rules to restrict access
3. **SSL/TLS**: Always use SSL for Redis connections in production
4. **Role-based Access**: Assign minimum required permissions
5. **Token Refresh**: The application handles automatic token refresh

## Cache Usage

The AI Risk Analysis service uses Redis for caching:

- **Cache Key Pattern**: `ai_risk_summary_{breachName}`
- **Expiration**: Configurable via `CacheExpirationHours`
- **Sliding Expiration**: Refreshes cache if accessed within 1/4 of expiration time
- **Fallback**: Graceful degradation if cache is unavailable 