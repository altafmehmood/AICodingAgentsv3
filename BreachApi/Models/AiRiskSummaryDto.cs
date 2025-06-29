namespace BreachApi.Models;

public class AiRiskSummaryDto
{
    public string BreachName { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string ExecutiveSummary { get; set; } = string.Empty;
    public string BusinessImpact { get; set; } = string.Empty;
    public string[] RecommendedActions { get; set; } = Array.Empty<string>();
    public string IndustryContext { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public bool IsFromCache { get; set; }
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}