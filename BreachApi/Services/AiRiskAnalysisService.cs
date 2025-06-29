using BreachApi.Models;
using Flurl.Http;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using LoggingTimings;

namespace BreachApi.Services;

public class AiRiskAnalysisService : IAiRiskAnalysisService
{
    private readonly IClaudeConfigurationService _configService;
    private readonly IDistributedCache _cache;
    private readonly ILogger<AiRiskAnalysisService> _logger;
    private readonly IConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions;

    public AiRiskAnalysisService(
        IClaudeConfigurationService configService,
        IDistributedCache cache,
        ILogger<AiRiskAnalysisService> logger,
        IConfiguration configuration)
    {
        _configService = configService;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        };
    }

    public async Task<AiRiskSummaryDto> GenerateRiskSummaryAsync(BreachDto breach)
    {
        using var timer = _logger.Time("AI Risk Summary Generation for {BreachName}", breach.Name);
        
        var cacheKey = $"ai_risk_summary_{breach.Name}";
        
        // Try to get from cache first
        AiRiskSummaryDto? cachedResult;
        using (var cacheTimer = _logger.Time("Cache lookup for {BreachName}", breach.Name))
        {
            cachedResult = await GetCachedSummaryAsync(cacheKey);
        }
        
        if (cachedResult != null)
        {
            _logger.LogInformation("CACHE HIT: AI risk summary for breach: {BreachName} retrieved from cache", breach.Name);
            
            cachedResult.IsFromCache = true;
            return cachedResult;
        }

        _logger.LogInformation("CACHE MISS: AI risk summary for breach: {BreachName} not found in cache, generating new summary", breach.Name);

        try
        {
            _logger.LogInformation("Generating AI risk summary for breach: {BreachName}", breach.Name);
            
            var prompt = BuildPrompt(breach);
            var claudeResponse = await CallClaudeApiAsync(prompt);
            var riskSummary = ParseClaudeResponse(claudeResponse, breach.Name);
            
            // Cache the result
            using (var cacheSetTimer = _logger.Time("Cache set for {BreachName}", breach.Name))
            {
                await CacheSummaryAsync(cacheKey, riskSummary);
            }
            
            _logger.LogInformation("Successfully generated AI risk summary for breach: {BreachName}", breach.Name);
            
            return riskSummary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate AI risk summary for breach: {BreachName}", breach.Name);
            throw;
        }
    }

    private string BuildPrompt(BreachDto breach)
    {
        var dataClassesText = string.Join(", ", breach.DataClasses);
        var verificationStatus = breach.IsVerified ? "Verified" : "Unverified";
        var sensitivityInfo = breach.IsSensitive ? "Contains sensitive data" : "Standard data breach";

        return $@"You are a cybersecurity expert analyzing a data breach. Provide a structured risk assessment for the following breach data:

Breach Name: {breach.Title}
Domain: {breach.Domain}
Affected Users: {breach.PwnCount:N0}
Breach Date: {breach.BreachDate:yyyy-MM-dd}
Data Types Compromised: {dataClassesText}
Verification Status: {verificationStatus}
Sensitivity Level: {sensitivityInfo}
Description: {breach.Description}

Provide your analysis in the following JSON format only, with no additional text:
{{
  ""riskLevel"": ""Critical|High|Medium|Low"",
  ""executiveSummary"": ""2-3 sentence overview focusing on key business risks"",
  ""businessImpact"": ""Detailed analysis of potential business impact including regulatory, financial, and reputational consequences"",
  ""recommendedActions"": [""action1"", ""action2"", ""action3""],
  ""industryContext"": ""Industry trends, similar breaches, and contextual information relevant to this incident""
}}

Focus on actionable insights and measurable business impact. Consider the number of affected users, types of data compromised, and verification status in your risk assessment.";
    }

    private async Task<ClaudeApiResponse> CallClaudeApiAsync(string prompt)
    {
        string apiKey, apiUrl, model;
        int maxTokens;
        
        using (var configTimer = _logger.Time("Claude API Configuration retrieval"))
        {
            apiKey = await _configService.GetApiKeyAsync();
            apiUrl = _configService.GetApiUrl();
            model = _configService.GetModel();
            maxTokens = _configService.GetMaxTokens();
        }

        var request = new ClaudeApiRequest
        {
            Model = model,
            MaxTokens = maxTokens,
            Messages = new[]
            {
                new ClaudeMessage
                {
                    Role = "user",
                    Content = prompt
                }
            }
        };

        _logger.LogInformation("Calling Claude API with model: {Model}, maxTokens: {MaxTokens}", model, maxTokens);

        using var apiTimer = _logger.Time("Claude API call");
        try
        {
            var response = await apiUrl
                .WithHeader("x-api-key", apiKey)
                .WithHeader("Content-Type", "application/json")
                .WithHeader("anthropic-version", "2023-06-01")
                .PostJsonAsync(request, cancellationToken: default)
                .ReceiveJson<ClaudeApiResponse>();

            _logger.LogInformation("Claude API call completed successfully, input tokens: {InputTokens}, output tokens: {OutputTokens}", 
                response.Usage?.InputTokens ?? 0, 
                response.Usage?.OutputTokens ?? 0);

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Claude API call failed");
            throw;
        }
    }

    private AiRiskSummaryDto ParseClaudeResponse(ClaudeApiResponse response, string breachName)
    {
        try
        {
            var content = response.Content.FirstOrDefault()?.Text ?? string.Empty;
            
            // Extract JSON from response (in case there's additional text)
            var jsonStart = content.IndexOf('{');
            var jsonEnd = content.LastIndexOf('}');
            
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonContent = content.Substring(jsonStart, jsonEnd - jsonStart + 1);
                var parsedResponse = JsonSerializer.Deserialize<ClaudeRiskAnalysis>(jsonContent, _jsonOptions);
                
                return new AiRiskSummaryDto
                {
                    BreachName = breachName,
                    RiskLevel = ParseRiskLevel(parsedResponse?.RiskLevel ?? "Medium"),
                    ExecutiveSummary = parsedResponse?.ExecutiveSummary ?? "Risk analysis unavailable",
                    BusinessImpact = parsedResponse?.BusinessImpact ?? "Impact analysis unavailable",
                    RecommendedActions = parsedResponse?.RecommendedActions ?? Array.Empty<string>(),
                    IndustryContext = parsedResponse?.IndustryContext ?? "Context unavailable",
                    GeneratedAt = DateTime.UtcNow,
                    IsFromCache = false
                };
            }
            
            throw new InvalidOperationException("Invalid JSON response from Claude API");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Claude API response for breach: {BreachName}", breachName);
            throw new InvalidOperationException("Failed to parse AI response", ex);
        }
    }

    private static RiskLevel ParseRiskLevel(string riskLevelText)
    {
        return riskLevelText.ToLowerInvariant() switch
        {
            "critical" => RiskLevel.Critical,
            "high" => RiskLevel.High,
            "medium" => RiskLevel.Medium,
            "low" => RiskLevel.Low,
            _ => RiskLevel.Medium
        };
    }

    private async Task<AiRiskSummaryDto?> GetCachedSummaryAsync(string cacheKey)
    {
        try
        {
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                using var deserializeTimer = _logger.Time("Cache data deserialization for {CacheKey}", cacheKey);
                var result = JsonSerializer.Deserialize<AiRiskSummaryDto>(cachedData, _jsonOptions);
                
                _logger.LogDebug("Cache data deserialized for key: {CacheKey}, data size: {DataSize} bytes", 
                    cacheKey, cachedData.Length);
                
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve cached AI risk summary for key: {CacheKey}", cacheKey);
        }
        
        return null;
    }

    private async Task CacheSummaryAsync(string cacheKey, AiRiskSummaryDto summary)
    {
        try
        {
            var cacheExpirationHours = _configuration.GetValue<int>("Redis:CacheExpirationHours", 24);
            
            // Ensure minimum cache expiration time
            if (cacheExpirationHours <= 0)
            {
                cacheExpirationHours = 24; // Default to 24 hours
                _logger.LogWarning("Invalid cache expiration hours configured, using default of 24 hours");
            }
            
            // Calculate sliding expiration as 1/4 of absolute expiration, with minimum of 1 hour
            var slidingExpirationHours = Math.Max(1, cacheExpirationHours / 4);
            
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(cacheExpirationHours),
                SlidingExpiration = TimeSpan.FromHours(slidingExpirationHours)
            };
            
            string serializedSummary;
            using (var serializeTimer = _logger.Time("Cache data serialization for {CacheKey}", cacheKey))
            {
                serializedSummary = JsonSerializer.Serialize(summary, _jsonOptions);
            }
            
            using (var cacheSetTimer = _logger.Time("Redis cache set for {CacheKey}", cacheKey))
            {
                await _cache.SetStringAsync(cacheKey, serializedSummary, cacheOptions);
            }
            
            _logger.LogInformation("CACHE SET: AI risk summary cached for key: {CacheKey}, data size: {DataSize} bytes, expires in {Hours}h (sliding: {SlidingHours}h)", 
                cacheKey, serializedSummary.Length, cacheExpirationHours, slidingExpirationHours);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cache AI risk summary for key: {CacheKey}", cacheKey);
        }
    }

    private class ClaudeRiskAnalysis
    {
        public string RiskLevel { get; set; } = string.Empty;
        public string ExecutiveSummary { get; set; } = string.Empty;
        public string BusinessImpact { get; set; } = string.Empty;
        public string[] RecommendedActions { get; set; } = Array.Empty<string>();
        public string IndustryContext { get; set; } = string.Empty;
    }
}