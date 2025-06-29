using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using BreachApi.Services;

namespace BreachApi.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddBreachApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Core services
        services.AddHttpClient();
        services.AddMemoryCache();
        
        // Business services
        services.AddScoped<IHaveIBeenPwnedService, HaveIBeenPwnedService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddScoped<IClaudeConfigurationService, ClaudeConfigurationService>();
        services.AddScoped<IAiRiskAnalysisService, AiRiskAnalysisService>();
        
        return services;
    }
    
    public static IServiceCollection AddRedisCache(this IServiceCollection services, IConfiguration configuration)
    {
        try
        {
            var keyVaultName = configuration["Claude:KeyVaultName"];
            if (string.IsNullOrEmpty(keyVaultName))
            {
                Console.WriteLine("Key Vault name not configured, using in-memory cache");
                services.AddDistributedMemoryCache();
                return services;
            }

            var keyVaultUri = new Uri($"https://{keyVaultName}.vault.azure.net/");
            var credential = new DefaultAzureCredential();
            var secretClient = new SecretClient(keyVaultUri, credential);
            
            var redisConnectionStringSecret = secretClient.GetSecret("redis-connection-string");
            var redisConnectionString = redisConnectionStringSecret.Value.Value;
            
            if (string.IsNullOrEmpty(redisConnectionString))
            {
                Console.WriteLine("Redis connection string is empty, using in-memory cache");
                services.AddDistributedMemoryCache();
                return services;
            }

            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisConnectionString;
                options.InstanceName = configuration["Redis:InstanceName"] ?? "BreachViewerCache";
            });
            
            services.AddHealthChecks()
                .AddRedis(redisConnectionString, name: "redis", tags: new[] { "cache", "redis" });
            
            Console.WriteLine("Configured Azure Cache for Redis using connection string from Key Vault");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to configure Redis from Key Vault, using in-memory cache as fallback: {ex.Message}");
            services.AddDistributedMemoryCache();
        }
        
        return services;
    }
} 