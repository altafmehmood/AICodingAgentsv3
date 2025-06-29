using BreachApi.Models;
using BreachApi.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BreachApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BreachController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<BreachController> _logger;

    public BreachController(IMediator mediator, ILogger<BreachController> logger)
    {
        _mediator = mediator;
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

        var query = new GetBreachesQuery(request.From, request.To);
        var breaches = await _mediator.Send(query);

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

        var query = new GetBreachesPdfQuery(request.From, request.To);
        var pdfBytes = await _mediator.Send(query);

        var fileName = $"breach-report-{DateTime.UtcNow:yyyy-MM-dd-HHmmss}.pdf";
        
        return File(pdfBytes, "application/pdf", fileName);
    }
}