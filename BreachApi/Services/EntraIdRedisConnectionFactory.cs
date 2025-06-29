using Azure.Core;
using Azure.Identity;
using StackExchange.Redis;
using System.Collections.Concurrent;

namespace BreachApi.Services;

public class EntraIdRedisConnectionFactory : IDisposable
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EntraIdRedisConnectionFactory> _logger;
    private readonly DefaultAzureCredential _credential;
    private readonly ConcurrentDictionary<string, (string Token, DateTimeOffset ExpiresAt)> _tokenCache;
    private ConnectionMultiplexer? _connection;
    private readonly SemaphoreSlim _connectionLock = new(1, 1);
    private readonly Timer _tokenRefreshTimer;
    private bool _disposed;

    public EntraIdRedisConnectionFactory(IConfiguration configuration, ILogger<EntraIdRedisConnectionFactory> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _credential = new DefaultAzureCredential();
        _tokenCache = new ConcurrentDictionary<string, (string, DateTimeOffset)>();
        
        // Set up token refresh timer (refresh every 30 minutes)
        _tokenRefreshTimer = new Timer(RefreshTokenCallback, null, TimeSpan.Zero, TimeSpan.FromMinutes(30));
    }

    public async Task<IConnectionMultiplexer> GetConnectionAsync()
    {
        if (_connection != null && _connection.IsConnected)
        {
            return _connection;
        }

        await _connectionLock.WaitAsync();
        try
        {
            if (_connection != null && _connection.IsConnected)
            {
                return _connection;
            }

            _connection?.Dispose();
            _connection = await CreateConnectionAsync();
            return _connection;
        }
        finally
        {
            _connectionLock.Release();
        }
    }

    private async Task<ConnectionMultiplexer> CreateConnectionAsync()
    {
        try
        {
            var token = await GetRedisTokenAsync();
            var baseConnectionString = _configuration["Redis:ConnectionString"] ?? 
                                     throw new InvalidOperationException("Redis connection string not configured");

            // Create configuration options
            var configOptions = new ConfigurationOptions
            {
                EndPoints = { ExtractEndpointFromConnectionString(baseConnectionString) },
                Ssl = true,
                AbortOnConnectFail = false,
                ConnectTimeout = _configuration.GetValue<int>("Redis:ConnectTimeout", 5000),
                ConnectRetry = _configuration.GetValue<int>("Redis:ConnectRetry", 3),
                SyncTimeout = _configuration.GetValue<int>("Redis:SyncTimeout", 5000),
                DefaultDatabase = _configuration.GetValue<int>("Redis:DefaultDatabase", 0),
                User = "", // Empty user for Entra ID
                Password = token
            };

            _logger.LogInformation("Creating Redis connection with Entra ID authentication");
            var connection = await ConnectionMultiplexer.ConnectAsync(configOptions);
            
            _logger.LogInformation("Successfully connected to Redis with Entra ID authentication");
            return connection;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Redis connection with Entra ID authentication");
            throw;
        }
    }

    private async Task<string> GetRedisTokenAsync()
    {
        const string cacheKey = "redis_token";
        
        if (_tokenCache.TryGetValue(cacheKey, out var cachedToken) && 
            cachedToken.ExpiresAt > DateTimeOffset.UtcNow.AddMinutes(5)) // Refresh 5 minutes before expiry
        {
            return cachedToken.Token;
        }

        try
        {
            _logger.LogDebug("Requesting new Redis token from Entra ID");
            
            var tokenRequestContext = new TokenRequestContext(new[] { "https://redis.azure.com/.default" });
            var tokenResponse = await _credential.GetTokenAsync(tokenRequestContext);
            
            _tokenCache[cacheKey] = (tokenResponse.Token, tokenResponse.ExpiresOn);
            
            _logger.LogDebug("Successfully obtained Redis token, expires at {ExpiresAt}", tokenResponse.ExpiresOn);
            return tokenResponse.Token;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to obtain Redis token from Entra ID");
            throw;
        }
    }

    private void RefreshTokenCallback(object? state)
    {
        if (_disposed) return;
        
        _ = Task.Run(async () =>
        {
            try
            {
                await GetRedisTokenAsync(); // This will refresh the cached token
                _logger.LogDebug("Redis token refreshed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh Redis token");
            }
        });
    }

    private static string ExtractEndpointFromConnectionString(string connectionString)
    {
        // Extract the endpoint from connection string like "akhs.redis.cache.windows.net:6380,ssl=True,abortConnect=False"
        var parts = connectionString.Split(',');
        return parts[0]; // Returns "akhs.redis.cache.windows.net:6380"
    }

    public void Dispose()
    {
        if (_disposed) return;
        
        _disposed = true;
        _tokenRefreshTimer?.Dispose();
        _connection?.Dispose();
        _connectionLock?.Dispose();
    }
} 