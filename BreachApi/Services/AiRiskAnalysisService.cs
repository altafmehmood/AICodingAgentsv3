using BreachApi.Models;
using Flurl.Http;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

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
        var cacheKey = $"ai_risk_summary_{breach.Name}";
        
        // Try to get from cache first
        var cachedResult = await GetCachedSummaryAsync(cacheKey);
        if (cachedResult != null)
        {
            cachedResult.IsFromCache = true;
            return cachedResult;
        }

        try
        {
            _logger.LogInformation("Generating AI risk summary for breach: {BreachName}", breach.Name);
            
            var prompt = BuildPrompt(breach);
            var claudeResponse = await CallClaudeApiAsync(prompt);
            var riskSummary = ParseClaudeResponse(claudeResponse, breach.Name);
            
            // Cache the result
            await CacheSummaryAsync(cacheKey, riskSummary);
            
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
        var apiKey = await _configService.GetApiKeyAsync();
        var apiUrl = _configService.GetApiUrl();
        var model = _configService.GetModel();
        var maxTokens = _configService.GetMaxTokens();

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

        var response = await apiUrl
            .WithHeader("x-api-key", apiKey)
            .WithHeader("Content-Type", "application/json")
            .WithHeader("anthropic-version", "2023-06-01")
            .PostJsonAsync(request, cancellationToken: default)
            .ReceiveJson<ClaudeApiResponse>();

        return response;
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
                return JsonSerializer.Deserialize<AiRiskSummaryDto>(cachedData, _jsonOptions);
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
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(cacheExpirationHours),
                SlidingExpiration = TimeSpan.FromHours(cacheExpirationHours / 4) // Refresh cache if accessed within 1/4 of expiration time
            };
            
            var serializedSummary = JsonSerializer.Serialize(summary, _jsonOptions);
            await _cache.SetStringAsync(cacheKey, serializedSummary, cacheOptions);
            
            _logger.LogDebug("Cached AI risk summary for key: {CacheKey}, expires in {Hours} hours", 
                cacheKey, cacheExpirationHours);
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