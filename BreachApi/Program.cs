using BreachApi.Middleware;
using BreachApi.Services;
using Microsoft.Extensions.Caching.Distributed;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;

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

// Configure Azure Cache for Redis using connection string from Key Vault
try 
{
    // Get Redis connection string from Key Vault
    var keyVaultName = builder.Configuration["Claude:KeyVaultName"];
    if (!string.IsNullOrEmpty(keyVaultName))
    {
        var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
        var credential = new DefaultAzureCredential();
        var secretClient = new SecretClient(keyVaultUri, credential);
        
        var redisConnectionStringSecret = secretClient.GetSecret("redis-connection-string");
        var redisConnectionString = redisConnectionStringSecret.Value.Value;
        
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            // Configure standard Redis cache with connection string from Key Vault
            builder.Services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = builder.Configuration["Redis:InstanceName"] ?? "BreachViewerCache";
            });
            
            // Add Redis health check
            builder.Services.AddHealthChecks()
                .AddRedis(redisConnectionString, name: "redis", tags: new[] { "cache", "redis" });
            
            Console.WriteLine("Configured Azure Cache for Redis using connection string from Key Vault");
        }
        else
        {
            throw new InvalidOperationException("Redis connection string is empty in Key Vault");
        }
    }
    else
    {
        throw new InvalidOperationException("Key Vault name not configured");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Failed to configure Redis from Key Vault: {ex.Message}");
    Console.WriteLine("Using in-memory distributed cache as fallback.");
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
