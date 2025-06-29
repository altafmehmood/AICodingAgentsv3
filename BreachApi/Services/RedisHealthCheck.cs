using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace BreachApi.Services;

public class RedisHealthCheck : IHealthCheck
{
    private readonly EntraIdRedisConnectionFactory _connectionFactory;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(EntraIdRedisConnectionFactory connectionFactory, ILogger<RedisHealthCheck> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var connection = await _connectionFactory.GetConnectionAsync();
            var database = connection.GetDatabase();
            
            // Perform a simple ping to test connectivity
            var pingTime = await database.PingAsync();
            
            if (pingTime.TotalMilliseconds > 1000) // Consider slow if > 1 second
            {
                _logger.LogWarning("Redis connection is slow: {PingTime}ms", pingTime.TotalMilliseconds);
                return HealthCheckResult.Degraded($"Redis connection is slow: {pingTime.TotalMilliseconds:F2}ms");
            }
            
            _logger.LogDebug("Redis health check successful: {PingTime}ms", pingTime.TotalMilliseconds);
            return HealthCheckResult.Healthy($"Redis connection is healthy: {pingTime.TotalMilliseconds:F2}ms");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return HealthCheckResult.Unhealthy("Redis connection failed", ex);
        }
    }
} 