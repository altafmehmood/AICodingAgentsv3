using BreachApi.Models;
using BreachApi.Queries;
using BreachApi.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class GetAiRiskSummaryQueryHandlerTests
{
    private readonly IHaveIBeenPwnedService _breachService;
    private readonly IAiRiskAnalysisService _aiService;
    private readonly ILogger<GetAiRiskSummaryQueryHandler> _logger;
    private readonly GetAiRiskSummaryQueryHandler _handler;

    public GetAiRiskSummaryQueryHandlerTests()
    {
        _breachService = Substitute.For<IHaveIBeenPwnedService>();
        _aiService = Substitute.For<IAiRiskAnalysisService>();
        _logger = Substitute.For<ILogger<GetAiRiskSummaryQueryHandler>>();
        _handler = new GetAiRiskSummaryQueryHandler(_breachService, _aiService, _logger);
    }

    [Fact]
    public async Task Handle_WithValidBreachName_ReturnsRiskSummary()
    {
        // Arrange
        var breachName = "TestBreach";
        var query = new GetAiRiskSummaryQuery { BreachName = breachName };
        
        var breach = new BreachDto
        {
            Name = breachName,
            Title = "Test Breach",
            Domain = "test.com",
            PwnCount = 1000000,
            Description = "Test breach description",
            DataClasses = new[] { "Email addresses", "Passwords" },
            IsVerified = true
        };

        var expectedSummary = new AiRiskSummaryDto
        {
            BreachName = breachName,
            RiskLevel = RiskLevel.High,
            ExecutiveSummary = "High risk breach",
            BusinessImpact = "Significant impact",
            RecommendedActions = new[] { "Action 1", "Action 2" },
            IndustryContext = "Industry context",
            GeneratedAt = DateTime.UtcNow,
            IsFromCache = false
        };

        _breachService.GetBreachesAsync(null, null)
            .Returns(new[] { breach });

        _aiService.GenerateRiskSummaryAsync(breach)
            .Returns(expectedSummary);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(expectedSummary.BreachName, result.BreachName);
        Assert.Equal(expectedSummary.RiskLevel, result.RiskLevel);
        Assert.Equal(expectedSummary.ExecutiveSummary, result.ExecutiveSummary);
        
        await _breachService.Received(1).GetBreachesAsync(null, null);
        await _aiService.Received(1).GenerateRiskSummaryAsync(breach);
    }

    [Fact]
    public async Task Handle_WithNonExistentBreach_ThrowsInvalidOperationException()
    {
        // Arrange
        var query = new GetAiRiskSummaryQuery { BreachName = "NonExistentBreach" };
        
        _breachService.GetBreachesAsync(null, null)
            .Returns(Array.Empty<BreachDto>());

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
            _handler.Handle(query, CancellationToken.None));
        
        Assert.Contains("not found", exception.Message);
        await _aiService.DidNotReceive().GenerateRiskSummaryAsync(Arg.Any<BreachDto>());
    }

    [Fact]
    public async Task Handle_WithCaseInsensitiveBreachName_ReturnsRiskSummary()
    {
        // Arrange
        var breachName = "testbreach";
        var query = new GetAiRiskSummaryQuery { BreachName = breachName };
        
        var breach = new BreachDto
        {
            Name = "TestBreach", // Different case
            Title = "Test Breach",
            Domain = "test.com"
        };

        var expectedSummary = new AiRiskSummaryDto
        {
            BreachName = "TestBreach",
            RiskLevel = RiskLevel.Medium
        };

        _breachService.GetBreachesAsync(null, null)
            .Returns(new[] { breach });

        _aiService.GenerateRiskSummaryAsync(breach)
            .Returns(expectedSummary);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(expectedSummary.BreachName, result.BreachName);
        await _aiService.Received(1).GenerateRiskSummaryAsync(breach);
    }
}