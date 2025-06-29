namespace BreachApi.Models;

public class BreachDto
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public DateTime BreachDate { get; set; }
    public DateTime AddedDate { get; set; }
    public DateTime ModifiedDate { get; set; }
    public int PwnCount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string[] DataClasses { get; set; } = Array.Empty<string>();
    public bool IsVerified { get; set; }
    public bool IsFabricated { get; set; }
    public bool IsSensitive { get; set; }
    public bool IsRetired { get; set; }
    public bool IsSpamList { get; set; }
    public bool IsMalware { get; set; }
    public string LogoPath { get; set; } = string.Empty;
}