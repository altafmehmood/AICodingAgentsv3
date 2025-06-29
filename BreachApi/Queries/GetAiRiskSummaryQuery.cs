using BreachApi.Models;
using MediatR;

namespace BreachApi.Queries;

public class GetAiRiskSummaryQuery : IRequest<AiRiskSummaryDto>
{
    public string BreachName { get; set; } = string.Empty;
}