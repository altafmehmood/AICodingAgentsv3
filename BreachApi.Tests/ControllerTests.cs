using BreachApi.Controllers;
using BreachApi.Models;
using BreachApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class BreachControllerTests
{
    private readonly IHaveIBeenPwnedService _breachService;
    private readonly IPdfService _pdfService;
    private readonly IAiRiskAnalysisService _aiService;
    private readonly ILogger<BreachController> _logger;
    private readonly BreachController _controller;

    public BreachControllerTests()
    {
        _breachService = Substitute.For<IHaveIBeenPwnedService>();
        _pdfService = Substitute.For<IPdfService>();
        _aiService = Substitute.For<IAiRiskAnalysisService>();
        _logger = Substitute.For<ILogger<BreachController>>();
        
        _controller = new BreachController(_breachService, _pdfService, _aiService, _logger);
    }

    [Fact]
    public async Task GetBreaches_ShouldReturnOkResult_WithBreaches()
    {
        // Arrange
        var request = new BreachQueryRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        var expectedBreaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        _breachService.GetBreachesAsync(request.From, request.To)
            .Returns(expectedBreaches);

        // Act
        var result = await _controller.GetBreaches(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(expectedBreaches, okResult.Value);
    }

    [Fact]
    public async Task GetBreachesPdf_ShouldReturnFileResult_WithPdf()
    {
        // Arrange
        var request = new BreachPdfRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        var breaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        var expectedPdf = new byte[] { 1, 2, 3, 4 };

        _breachService.GetBreachesAsync(request.From, request.To)
            .Returns(breaches);
        _pdfService.GeneratePdfAsync(breaches)
            .Returns(expectedPdf);

        // Act
        var result = await _controller.GetBreachesPdf(request);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.Equal(expectedPdf, fileResult.FileContents);
        Assert.Contains("breach-report-", fileResult.FileDownloadName);
    }

    [Fact]
    public async Task GetAiRiskSummary_ShouldReturnOkResult_WithSummary()
    {
        // Arrange
        var breachName = "Test Breach";
        var breaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        var expectedSummary = new AiRiskSummaryDto
        {
            BreachName = breachName,
            RiskLevel = RiskLevel.High,
            ExecutiveSummary = "Test executive summary",
            BusinessImpact = "Test business impact",
            RecommendedActions = new[] { "Action 1", "Action 2" },
            IndustryContext = "Test industry context",
            GeneratedAt = DateTime.UtcNow,
            IsFromCache = false
        };

        _breachService.GetBreachesAsync(null, null)
            .Returns(breaches);
        _aiService.GenerateRiskSummaryAsync(breaches.First())
            .Returns(expectedSummary);

        // Act
        var result = await _controller.GetAiRiskSummary(breachName);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(expectedSummary, okResult.Value);
    }

    [Fact]
    public async Task GetAiRiskSummary_ShouldReturnBadRequest_WhenBreachNameIsEmpty()
    {
        // Act
        var result = await _controller.GetAiRiskSummary("");

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Breach name is required", badRequestResult.Value);
    }

    [Fact]
    public async Task GetAiRiskSummary_ShouldReturnNotFound_WhenBreachDoesNotExist()
    {
        // Arrange
        var breachName = "NonExistent Breach";
        var breaches = new List<BreachDto>
        {
            new() { Name = "Different Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        _breachService.GetBreachesAsync(null, null)
            .Returns(breaches);

        // Act
        var result = await _controller.GetAiRiskSummary(breachName);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Contains("not found", notFoundResult.Value?.ToString());
    }
}