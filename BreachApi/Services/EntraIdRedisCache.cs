using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;
using System.Text;

namespace BreachApi.Services;

public class EntraIdRedisCache : IDistributedCache, IDisposable
{
    private readonly EntraIdRedisConnectionFactory _connectionFactory;
    private readonly ILogger<EntraIdRedisCache> _logger;
    private readonly string _instanceName;
    private bool _disposed;

    public EntraIdRedisCache(EntraIdRedisConnectionFactory connectionFactory, IConfiguration configuration, ILogger<EntraIdRedisCache> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
        _instanceName = configuration["Redis:InstanceName"] ?? "BreachViewerCache";
    }

    public byte[]? Get(string key)
    {
        return GetAsync(key).GetAwaiter().GetResult();
    }

    public async Task<byte[]?> GetAsync(string key, CancellationToken token = default)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key));

        try
        {
            var connection = await _connectionFactory.GetConnectionAsync();
            var database = connection.GetDatabase();
            var prefixedKey = GetPrefixedKey(key);
            
            var value = await database.StringGetAsync(prefixedKey);
            
            if (value.HasValue)
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                return value;
            }
            
            _logger.LogDebug("Cache miss for key: {Key}", key);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get cache value for key: {Key}", key);
            return null; // Graceful degradation
        }
    }

    public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
    {
        SetAsync(key, value, options).GetAwaiter().GetResult();
    }

    public async Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key));
        
        if (value == null)
            throw new ArgumentNullException(nameof(value));

        try
        {
            var connection = await _connectionFactory.GetConnectionAsync();
            var database = connection.GetDatabase();
            var prefixedKey = GetPrefixedKey(key);
            
            var expiry = GetExpiry(options);
            
            await database.StringSetAsync(prefixedKey, value, expiry);
            
            _logger.LogDebug("Cached value for key: {Key}, expires in: {Expiry}", key, expiry?.ToString() ?? "never");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set cache value for key: {Key}", key);
            // Don't throw - allow application to continue without caching
        }
    }

    public void Refresh(string key)
    {
        RefreshAsync(key).GetAwaiter().GetResult();
    }

    public async Task RefreshAsync(string key, CancellationToken token = default)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key));

        try
        {
            var connection = await _connectionFactory.GetConnectionAsync();
            var database = connection.GetDatabase();
            var prefixedKey = GetPrefixedKey(key);
            
            // Touch the key to refresh its expiration
            await database.KeyTouchAsync(prefixedKey);
            
            _logger.LogDebug("Refreshed cache key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to refresh cache key: {Key}", key);
            // Don't throw - allow application to continue
        }
    }

    public void Remove(string key)
    {
        RemoveAsync(key).GetAwaiter().GetResult();
    }

    public async Task RemoveAsync(string key, CancellationToken token = default)
    {
        if (string.IsNullOrEmpty(key))
            throw new ArgumentNullException(nameof(key));

        try
        {
            var connection = await _connectionFactory.GetConnectionAsync();
            var database = connection.GetDatabase();
            var prefixedKey = GetPrefixedKey(key);
            
            await database.KeyDeleteAsync(prefixedKey);
            
            _logger.LogDebug("Removed cache key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache key: {Key}", key);
            // Don't throw - allow application to continue
        }
    }

    private string GetPrefixedKey(string key)
    {
        return $"{_instanceName}:{key}";
    }

    private static TimeSpan? GetExpiry(DistributedCacheEntryOptions options)
    {
        if (options.AbsoluteExpirationRelativeToNow.HasValue)
        {
            return options.AbsoluteExpirationRelativeToNow.Value;
        }

        if (options.AbsoluteExpiration.HasValue)
        {
            return options.AbsoluteExpiration.Value - DateTimeOffset.UtcNow;
        }

        return options.SlidingExpiration;
    }

    public void Dispose()
    {
        if (_disposed) return;
        
        _disposed = true;
        _connectionFactory?.Dispose();
    }
}

// Extension methods for easier string caching
public static class EntraIdRedisCacheExtensions
{
    public static async Task<string?> GetStringAsync(this EntraIdRedisCache cache, string key, CancellationToken token = default)
    {
        var bytes = await cache.GetAsync(key, token);
        return bytes != null ? Encoding.UTF8.GetString(bytes) : null;
    }

    public static async Task SetStringAsync(this EntraIdRedisCache cache, string key, string value, DistributedCacheEntryOptions options, CancellationToken token = default)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        await cache.SetAsync(key, bytes, options, token);
    }
} 