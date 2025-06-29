# AI Risk Analysis Feature Setup Guide

This guide explains how to configure and use the AI-enhanced risk analysis feature powered by Anthropic Claude 4.

## Prerequisites

1. **Anthropic API Key**: Obtain an API key from [Anthropic Console](https://console.anthropic.com/)
2. **Azure Key Vault** (Optional, for production): For secure API key storage
3. **Redis Cache** (Optional): For improved performance and caching

## Configuration Options

### Option 1: Local Development (User Secrets)

For local development, use .NET User Secrets to store your API key securely:

```bash
# Navigate to the BreachApi project directory
cd BreachApi

# Set the Claude API key using user secrets
dotnet user-secrets set "Claude:ApiKey" "your-anthropic-api-key-here"

# Verify the secret was set
dotnet user-secrets list
```

### Option 2: Environment Variables

Set environment variables in your development environment:

```bash
export Claude__ApiKey="your-anthropic-api-key-here"
export Redis__ConnectionString="localhost:6379"  # Optional for Redis
```

### Option 3: Production (Azure Key Vault)

For production deployments, configure Azure Key Vault:

```json
{
  "Claude": {
    "KeyVaultName": "your-keyvault-name",
    "SecretName": "anthropic-claude-api-key"
  }
}
```

## Configuration Parameters

The following configuration parameters are available in `appsettings.json`:

```json
{
  "Claude": {
    "ApiUrl": "https://api.anthropic.com/v1/messages",
    "Model": "claude-3-5-sonnet-20241022",
    "MaxTokens": 1000,
    "KeyVaultName": "",  // Leave empty for local development
    "SecretName": "anthropic-claude-api-key"
  },
  "Redis": {
    "ConnectionString": "",  // Optional: Redis connection string
    "CacheExpirationHours": 24
  }
}
```

### Parameter Descriptions

- **ApiUrl**: Anthropic API endpoint (should not be changed)
- **Model**: Claude model to use for analysis
- **MaxTokens**: Maximum tokens per API request (1000 recommended for risk summaries)
- **KeyVaultName**: Azure Key Vault name (production only)
- **SecretName**: Name of the secret in Key Vault
- **Redis.ConnectionString**: Redis connection string for caching
- **Redis.CacheExpirationHours**: How long to cache AI responses (24 hours default)

## API Usage

### Endpoint

```
GET /api/breach/{breachName}/ai-summary
```

### Example Request

```bash
curl -X GET "https://localhost:7001/api/breach/Adobe/ai-summary" \
     -H "accept: application/json"
```

### Example Response

```json
{
  "breachName": "Adobe",
  "riskLevel": 3,
  "executiveSummary": "High-severity breach affecting 153 million user accounts with comprehensive personal data exposure.",
  "businessImpact": "Significant regulatory compliance risks under GDPR/CCPA with potential multi-million dollar fines. Major reputational damage likely affecting customer trust and market position.",
  "recommendedActions": [
    "Implement immediate password reset for all affected users",
    "Enhance encryption standards for stored user data",
    "Conduct comprehensive security audit of data storage systems"
  ],
  "industryContext": "This breach represents one of the largest in the creative software industry, highlighting systemic vulnerabilities in legacy authentication systems commonly used by enterprise software providers.",
  "generatedAt": "2024-01-15T10:30:00Z",
  "isFromCache": false
}
```

## Rate Limiting

The AI analysis endpoint is rate-limited to prevent abuse:

- **Limit**: 10 requests per minute per client
- **Identification**: By user ID (if authenticated) or IP address
- **Headers**: Response includes `X-RateLimit-Limit` and `X-RateLimit-Remaining`

## Caching Strategy

To optimize performance and reduce API costs:

1. **In-Memory Cache**: API keys are cached for 30 minutes
2. **Distributed Cache**: AI responses are cached for 24 hours (configurable)
3. **Cache Indicators**: Response includes `isFromCache` field

## Error Handling

The system includes comprehensive error handling:

### Common Error Scenarios

1. **Invalid API Key**
   ```json
   {
     "statusCode": 401,
     "message": "Failed to retrieve Claude API key from Key Vault",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

2. **Rate Limit Exceeded**
   ```json
   {
     "error": "Rate limit exceeded",
     "message": "Maximum 10 requests per minute allowed for AI analysis endpoints",
     "retryAfter": 60
   }
   ```

3. **Breach Not Found**
   ```json
   {
     "statusCode": 400,
     "message": "Breach 'InvalidBreachName' not found",
     "timestamp": "2024-01-15T10:30:00Z"
   }
   ```

## Security Considerations

1. **API Key Protection**
   - Never commit API keys to source control
   - Use User Secrets for local development
   - Use Azure Key Vault for production
   - API keys are cached securely in memory with expiration

2. **Request Validation**
   - Breach names are URL-encoded for safety
   - Input validation prevents injection attacks
   - Rate limiting prevents abuse

3. **Response Sanitization**
   - AI responses are parsed and validated
   - Potentially sensitive information is not logged
   - Error messages don't expose internal details

## Monitoring and Observability

The system logs the following metrics:

- AI API call success/failure rates
- Response times and token usage
- Cache hit/miss ratios
- Rate limiting events

### Key Log Events

```csharp
// Successful AI analysis
_logger.LogInformation("Successfully generated AI risk summary for breach: {BreachName}", breachName);

// Rate limiting
_logger.LogWarning("Rate limit exceeded for client: {ClientId}", clientId);

// Configuration errors
_logger.LogError(ex, "Failed to retrieve API key from Key Vault {KeyVaultName}", keyVaultName);
```

## Troubleshooting

### Common Issues

1. **"Claude API key not configured"**
   - Verify User Secrets are set correctly
   - Check environment variables
   - Ensure KeyVault configuration is correct

2. **"Failed to retrieve API key from Key Vault"**
   - Verify Azure credentials and permissions
   - Check KeyVault name and secret name
   - Ensure Managed Identity is configured

3. **Rate limit errors**
   - Wait for rate limit window to reset (1 minute)
   - Implement client-side retry logic with exponential backoff

4. **Cache not working**
   - Verify Redis connection string
   - Check Redis server availability
   - Review cache configuration settings

### Debug Mode

For debugging, enable detailed logging in `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "BreachApi.Services.AiRiskAnalysisService": "Debug",
      "BreachApi.Services.ClaudeConfigurationService": "Debug"
    }
  }
}
```

## Testing

### Unit Tests

Run the test suite to verify AI integration:

```bash
cd BreachApi.Tests
dotnet test
```

### Integration Testing

Test the endpoint manually:

```bash
# Start the API
cd BreachApi
dotnet run

# Test the endpoint
curl -X GET "https://localhost:7001/api/breach/Adobe/ai-summary"
```

## Cost Optimization

1. **Caching**: Enable Redis caching to reduce API calls
2. **Rate Limiting**: Prevents excessive usage
3. **Token Optimization**: MaxTokens is tuned for risk summaries
4. **Model Selection**: Using cost-effective Claude 3.5 Sonnet model

## Support

For issues with this feature:

1. Check the logs for detailed error messages
2. Verify configuration settings
3. Test with a simple breach name like "Adobe"
4. Review the troubleshooting section above

## API Key Pricing

Visit [Anthropic Pricing](https://docs.anthropic.com/en/api/pricing) for current API rates. The feature is designed to be cost-effective with appropriate caching and rate limiting.