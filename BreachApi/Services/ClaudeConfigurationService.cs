using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.Extensions.Caching.Memory;

namespace BreachApi.Services;

public class ClaudeConfigurationService : IClaudeConfigurationService
{
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ClaudeConfigurationService> _logger;
    private const string ApiKeyCacheKey = "claude_api_key";
    private const int CacheExpirationMinutes = 30;

    public ClaudeConfigurationService(
        IConfiguration configuration, 
        IMemoryCache cache, 
        ILogger<ClaudeConfigurationService> logger)
    {
        _configuration = configuration;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string> GetApiKeyAsync()
    {
        if (_cache.TryGetValue(ApiKeyCacheKey, out string? cachedKey) && !string.IsNullOrEmpty(cachedKey))
        {
            return cachedKey;
        }

        var keyVaultName = _configuration["Claude:KeyVaultName"];
        var secretName = _configuration["Claude:SecretName"] ?? "anthropic-claude-api-key";

        string apiKey;

        if (!string.IsNullOrEmpty(keyVaultName))
        {
            apiKey = await GetFromKeyVaultAsync(keyVaultName, secretName);
        }
        else
        {
            apiKey = _configuration["Claude:ApiKey"] ?? throw new InvalidOperationException("Claude API key not configured");
        }

        _cache.Set(ApiKeyCacheKey, apiKey, TimeSpan.FromMinutes(CacheExpirationMinutes));
        return apiKey;
    }

    public string GetApiUrl()
    {
        return _configuration["Claude:ApiUrl"] ?? "https://api.anthropic.com/v1/messages";
    }

    public string GetModel()
    {
        return _configuration["Claude:Model"] ?? "claude-3-5-sonnet-20241022";
    }

    public int GetMaxTokens()
    {
        return _configuration.GetValue("Claude:MaxTokens", 1000);
    }

    private async Task<string> GetFromKeyVaultAsync(string keyVaultName, string secretName)
    {
        try
        {
            var keyVaultUrl = $"https://{keyVaultName}.vault.azure.net/";
            var client = new SecretClient(new Uri(keyVaultUrl), new DefaultAzureCredential());
            
            var secret = await client.GetSecretAsync(secretName);
            return secret.Value.Value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve API key from Key Vault {KeyVaultName}", keyVaultName);
            throw new InvalidOperationException("Failed to retrieve Claude API key from Key Vault", ex);
        }
    }
}