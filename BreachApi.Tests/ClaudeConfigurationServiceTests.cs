using BreachApi.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class ClaudeConfigurationServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ClaudeConfigurationService> _logger;
    private readonly ClaudeConfigurationService _service;

    public ClaudeConfigurationServiceTests()
    {
        _configuration = Substitute.For<IConfiguration>();
        _cache = Substitute.For<IMemoryCache>();
        _logger = Substitute.For<ILogger<ClaudeConfigurationService>>();
        _service = new ClaudeConfigurationService(_configuration, _cache, _logger);
    }

    [Fact]
    public async Task GetApiKeyAsync_WithCachedKey_ReturnsCachedValue()
    {
        // Arrange
        const string cachedKey = "cached-api-key";
        object? cacheValue = cachedKey;
        
        _cache.TryGetValue(Arg.Any<string>(), out cacheValue)
            .Returns(x => 
            {
                x[1] = cachedKey;
                return true;
            });

        // Act
        var result = await _service.GetApiKeyAsync();

        // Assert
        Assert.Equal(cachedKey, result);
    }

    [Fact]
    public async Task GetApiKeyAsync_WithoutKeyVault_ReturnsConfigurationValue()
    {
        // Arrange
        const string configKey = "config-api-key";
        object? cacheValue = null;
        
        _cache.TryGetValue(Arg.Any<string>(), out cacheValue)
            .Returns(false);
        
        _configuration["Claude:KeyVaultName"].Returns((string?)null);
        _configuration["Claude:ApiKey"].Returns(configKey);

        // Act
        var result = await _service.GetApiKeyAsync();

        // Assert
        Assert.Equal(configKey, result);
    }

    [Fact]
    public async Task GetApiKeyAsync_WithoutApiKey_ThrowsInvalidOperationException()
    {
        // Arrange
        object? cacheValue = null;
        
        _cache.TryGetValue(Arg.Any<string>(), out cacheValue)
            .Returns(false);
        
        _configuration["Claude:KeyVaultName"].Returns((string?)null);
        _configuration["Claude:ApiKey"].Returns((string?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _service.GetApiKeyAsync());
    }

    [Fact]
    public void GetApiUrl_ReturnsConfiguredValue()
    {
        // Arrange
        const string expectedUrl = "https://api.anthropic.com/v1/messages";
        _configuration["Claude:ApiUrl"].Returns(expectedUrl);

        // Act
        var result = _service.GetApiUrl();

        // Assert
        Assert.Equal(expectedUrl, result);
    }

    [Fact]
    public void GetApiUrl_WithoutConfiguration_ReturnsDefault()
    {
        // Arrange
        _configuration["Claude:ApiUrl"].Returns((string?)null);

        // Act
        var result = _service.GetApiUrl();

        // Assert
        Assert.Equal("https://api.anthropic.com/v1/messages", result);
    }

    [Fact]
    public void GetModel_ReturnsConfiguredValue()
    {
        // Arrange
        const string expectedModel = "claude-3-5-sonnet-20241022";
        _configuration["Claude:Model"].Returns(expectedModel);

        // Act
        var result = _service.GetModel();

        // Assert
        Assert.Equal(expectedModel, result);
    }

    [Fact]
    public void GetMaxTokens_ReturnsConfiguredValue()
    {
        // Arrange
        const int expectedTokens = 1500;
        _configuration.GetValue("Claude:MaxTokens", 1000).Returns(expectedTokens);

        // Act
        var result = _service.GetMaxTokens();

        // Assert
        Assert.Equal(expectedTokens, result);
    }
}