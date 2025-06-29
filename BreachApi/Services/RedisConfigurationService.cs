using Azure.Identity;
using StackExchange.Redis;

namespace BreachApi.Services;

public class RedisConfigurationService : IRedisConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<RedisConfigurationService> _logger;

    public RedisConfigurationService(IConfiguration configuration, ILogger<RedisConfigurationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetConnectionStringAsync()
    {
        var baseConnectionString = _configuration["Redis:ConnectionString"] ?? 
                                  throw new InvalidOperationException("Redis connection string not configured");

        var useEntraId = _configuration.GetValue<bool>("Redis:UseEntraId", false);
        
        if (!useEntraId)
        {
            return baseConnectionString;
        }

        try
        {
            // Use DefaultAzureCredential for Entra ID authentication
            var credential = new DefaultAzureCredential();
            
            // Get access token for Redis
            var tokenRequestContext = new Azure.Core.TokenRequestContext(new[] { "https://redis.azure.com/.default" });
            var token = await credential.GetTokenAsync(tokenRequestContext);
            
            // Add the token to the connection string
            var connectionStringWithAuth = $"{baseConnectionString},user=,password={token.Token}";
            
            _logger.LogDebug("Successfully retrieved Entra ID token for Redis authentication");
            return connectionStringWithAuth;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to authenticate with Entra ID for Redis");
            throw new InvalidOperationException("Failed to authenticate with Azure Cache for Redis using Entra ID", ex);
        }
    }

    public string GetInstanceName()
    {
        return _configuration["Redis:InstanceName"] ?? "BreachViewerCache";
    }

    public int GetCacheExpirationHours()
    {
        return _configuration.GetValue<int>("Redis:CacheExpirationHours", 24);
    }

    public int GetDefaultDatabase()
    {
        return _configuration.GetValue<int>("Redis:DefaultDatabase", 0);
    }

    public int GetConnectTimeout()
    {
        return _configuration.GetValue<int>("Redis:ConnectTimeout", 5000);
    }

    public int GetConnectRetry()
    {
        return _configuration.GetValue<int>("Redis:ConnectRetry", 3);
    }

    public int GetSyncTimeout()
    {
        return _configuration.GetValue<int>("Redis:SyncTimeout", 5000);
    }

    public async Task<ConfigurationOptions> GetConfigurationOptionsAsync()
    {
        var connectionString = await GetConnectionStringAsync();
        var options = ConfigurationOptions.Parse(connectionString);
        
        options.AbortOnConnectFail = false;
        options.DefaultDatabase = GetDefaultDatabase();
        options.ConnectTimeout = GetConnectTimeout();
        options.ConnectRetry = GetConnectRetry();
        options.SyncTimeout = GetSyncTimeout();
        
        // For Entra ID, we need to handle token refresh
        if (_configuration.GetValue<bool>("Redis:UseEntraId", false))
        {
            options.Password = ""; // Will be set dynamically with token
        }
        
        return options;
    }
} 