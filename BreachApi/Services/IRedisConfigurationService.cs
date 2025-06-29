using StackExchange.Redis;

namespace BreachApi.Services;

public interface IRedisConfigurationService
{
    Task<string> GetConnectionStringAsync();
    string GetInstanceName();
    int GetCacheExpirationHours();
    int GetDefaultDatabase();
    int GetConnectTimeout();
    int GetConnectRetry();
    int GetSyncTimeout();
    Task<ConfigurationOptions> GetConfigurationOptionsAsync();
} 