using BreachApi.Models;

namespace BreachApi.Services;

public interface IAiRiskAnalysisService
{
    Task<AiRiskSummaryDto> GenerateRiskSummaryAsync(BreachDto breach);
}