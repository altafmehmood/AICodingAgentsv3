using BreachApi.Middleware;
using BreachApi.Services;
using StackExchange.Redis;
using Microsoft.Extensions.Caching.Distributed;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// Add health checks
builder.Services.AddHealthChecks();

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));

builder.Services.AddHttpClient();
builder.Services.AddScoped<IHaveIBeenPwnedService, HaveIBeenPwnedService>();
builder.Services.AddScoped<IPdfService, PdfService>();

// AI Services
builder.Services.AddMemoryCache();

// Register Redis configuration service
builder.Services.AddScoped<IRedisConfigurationService, RedisConfigurationService>();

// Configure Redis Cache
var redisConnectionString = builder.Configuration["Redis:ConnectionString"];
var useEntraId = builder.Configuration.GetValue<bool>("Redis:UseEntraId", false);

if (!string.IsNullOrEmpty(redisConnectionString))
{
    if (useEntraId)
    {
        // Configure Redis with Entra ID authentication
        builder.Services.AddSingleton<EntraIdRedisConnectionFactory>();
        builder.Services.AddSingleton<IDistributedCache, EntraIdRedisCache>();
        
        // Register health check for Entra ID Redis
        builder.Services.AddTransient<RedisHealthCheck>();
        
        builder.Services.AddHealthChecks()
            .AddCheck<RedisHealthCheck>("redis-entra", tags: new[] { "cache", "redis", "entra-id" });
        
        Console.WriteLine("Configured Azure Cache for Redis with Entra ID authentication");
    }
    else
    {
        // Standard Redis configuration
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConnectionString;
            options.InstanceName = builder.Configuration["Redis:InstanceName"] ?? "BreachViewerCache";
            
            // Add connection options from configuration
            if (int.TryParse(builder.Configuration["Redis:DefaultDatabase"], out var defaultDb))
            {
                options.ConfigurationOptions = new ConfigurationOptions
                {
                    EndPoints = { redisConnectionString },
                    DefaultDatabase = defaultDb,
                    ConnectTimeout = int.Parse(builder.Configuration["Redis:ConnectTimeout"] ?? "5000"),
                    ConnectRetry = int.Parse(builder.Configuration["Redis:ConnectRetry"] ?? "3"),
                    SyncTimeout = int.Parse(builder.Configuration["Redis:SyncTimeout"] ?? "5000"),
                    AbortOnConnectFail = false
                };
            }
        });
        
        // Add Redis health check
        builder.Services.AddHealthChecks()
            .AddRedis(redisConnectionString, name: "redis", tags: new[] { "cache", "redis" });
        
        Console.WriteLine($"Configured Azure Cache for Redis with connection string: {redisConnectionString.Split(',')[0]}...");
    }
}
else
{
    // Fallback to in-memory cache if Redis is not configured
    Console.WriteLine("Redis connection string not found. Using in-memory distributed cache as fallback.");
    builder.Services.AddDistributedMemoryCache();
}

builder.Services.AddScoped<IClaudeConfigurationService, ClaudeConfigurationService>();
builder.Services.AddScoped<IAiRiskAnalysisService, AiRiskAnalysisService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowAngularApp");

// Map health check endpoints
app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var response = new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                exception = entry.Value.Exception?.Message,
                duration = entry.Value.Duration.ToString()
            }),
            duration = report.TotalDuration.ToString()
        };
        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
    }
});

app.MapControllers();

app.Run();
