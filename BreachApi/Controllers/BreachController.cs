using BreachApi.Models;
using BreachApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace BreachApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BreachController : ControllerBase
{
    private readonly IHaveIBeenPwnedService _breachService;
    private readonly IPdfService _pdfService;
    private readonly IAiRiskAnalysisService _aiService;
    private readonly ILogger<BreachController> _logger;

    public BreachController(
        IHaveIBeenPwnedService breachService,
        IPdfService pdfService,
        IAiRiskAnalysisService aiService,
        ILogger<BreachController> logger)
    {
        _breachService = breachService;
        _pdfService = pdfService;
        _aiService = aiService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieves a list of data breaches from Have I Been Pwned API
    /// </summary>
    /// <param name="request">Query parameters including optional from and to dates</param>
    /// <returns>A list of breach data ordered by date descending</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BreachDto>>> GetBreaches([FromQuery] BreachQueryRequest request)
    {
        _logger.LogInformation("GetBreaches endpoint called with From: {From}, To: {To}", 
            request.From, request.To);

        var breaches = await _breachService.GetBreachesAsync(request.From, request.To);
        return Ok(breaches);
    }

    /// <summary>
    /// Generates a PDF report of data breaches from Have I Been Pwned API
    /// </summary>
    /// <param name="request">Query parameters including optional from and to dates</param>
    /// <returns>A PDF file containing the breach report</returns>
    [HttpGet("pdf")]
    public async Task<ActionResult> GetBreachesPdf([FromQuery] BreachPdfRequest request)
    {
        _logger.LogInformation("GetBreachesPdf endpoint called with From: {From}, To: {To}", 
            request.From, request.To);

        var breaches = await _breachService.GetBreachesAsync(request.From, request.To);
        var pdfBytes = await _pdfService.GeneratePdfAsync(breaches);

        var fileName = $"breach-report-{DateTime.UtcNow:yyyy-MM-dd-HHmmss}.pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    /// <summary>
    /// Generates an AI-powered risk summary for a specific data breach
    /// </summary>
    /// <param name="breachName">The name of the breach to analyze</param>
    /// <returns>AI-generated risk analysis and recommendations</returns>
    [HttpGet("{breachName}/ai-summary")]
    public async Task<ActionResult<AiRiskSummaryDto>> GetAiRiskSummary(string breachName)
    {
        _logger.LogInformation("GetAiRiskSummary endpoint called for breach: {BreachName}", breachName);

        if (string.IsNullOrWhiteSpace(breachName))
        {
            return BadRequest("Breach name is required");
        }

        // Get the specific breach efficiently
        var breaches = await _breachService.GetBreachesAsync(null, null);
        var targetBreach = breaches.FirstOrDefault(b => 
            string.Equals(b.Name, breachName, StringComparison.OrdinalIgnoreCase));

        if (targetBreach == null)
        {
            _logger.LogWarning("Breach not found: {BreachName}", breachName);
            return NotFound($"Breach '{breachName}' not found");
        }

        var riskSummary = await _aiService.GenerateRiskSummaryAsync(targetBreach);
        return Ok(riskSummary);
    }
}