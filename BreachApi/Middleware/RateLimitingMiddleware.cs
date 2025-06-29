using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.Json;

namespace BreachApi.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private readonly int _maxRequestsPerMinute = 10; // Configurable rate limit
    private readonly TimeSpan _timeWindow = TimeSpan.FromMinutes(1);

    public RateLimitingMiddleware(
        RequestDelegate next, 
        IMemoryCache cache, 
        ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only apply rate limiting to AI summary endpoints
        if (!context.Request.Path.Value?.Contains("/ai-summary") == true)
        {
            await _next(context);
            return;
        }

        var clientId = GetClientIdentifier(context);
        var cacheKey = $"rate_limit_{clientId}";

        var requestCount = _cache.Get<int>(cacheKey);
        
        if (requestCount >= _maxRequestsPerMinute)
        {
            _logger.LogWarning("Rate limit exceeded for client: {ClientId}", clientId);
            await HandleRateLimitExceeded(context);
            return;
        }

        // Increment request count
        _cache.Set(cacheKey, requestCount + 1, _timeWindow);

        // Add rate limit headers
        context.Response.Headers.Add("X-RateLimit-Limit", _maxRequestsPerMinute.ToString());
        context.Response.Headers.Add("X-RateLimit-Remaining", (_maxRequestsPerMinute - requestCount - 1).ToString());

        await _next(context);
    }

    private string GetClientIdentifier(HttpContext context)
    {
        // Try to get user ID first, then fall back to IP address
        var userId = context.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(userId))
        {
            return $"user_{userId}";
        }

        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"ip_{ipAddress}";
    }

    private async Task HandleRateLimitExceeded(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = "Rate limit exceeded",
            message = $"Maximum {_maxRequestsPerMinute} requests per minute allowed for AI analysis endpoints",
            retryAfter = _timeWindow.TotalSeconds
        };

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}