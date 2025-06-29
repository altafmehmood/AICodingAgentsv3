using BreachApi.Models;
using BreachApi.Services;
using MediatR;

namespace BreachApi.Queries;

public class GetAiRiskSummaryQueryHandler : IRequestHandler<GetAiRiskSummaryQuery, AiRiskSummaryDto>
{
    private readonly IHaveIBeenPwnedService _breachService;
    private readonly IAiRiskAnalysisService _aiService;
    private readonly ILogger<GetAiRiskSummaryQueryHandler> _logger;

    public GetAiRiskSummaryQueryHandler(
        IHaveIBeenPwnedService breachService,
        IAiRiskAnalysisService aiService,
        ILogger<GetAiRiskSummaryQueryHandler> logger)
    {
        _breachService = breachService;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<AiRiskSummaryDto> Handle(GetAiRiskSummaryQuery request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing AI risk summary request for breach: {BreachName}", request.BreachName);

            // Get all breaches and find the specific one
            var breaches = await _breachService.GetBreachesAsync(null, null);
            var targetBreach = breaches.FirstOrDefault(b => 
                string.Equals(b.Name, request.BreachName, StringComparison.OrdinalIgnoreCase));

            if (targetBreach == null)
            {
                _logger.LogWarning("Breach not found: {BreachName}", request.BreachName);
                throw new InvalidOperationException($"Breach '{request.BreachName}' not found");
            }

            var riskSummary = await _aiService.GenerateRiskSummaryAsync(targetBreach);
            
            _logger.LogInformation("Successfully processed AI risk summary for breach: {BreachName}", request.BreachName);
            return riskSummary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing AI risk summary for breach: {BreachName}", request.BreachName);
            throw;
        }
    }
}