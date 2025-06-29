using System.Text.Json.Serialization;

namespace BreachApi.Models;

public class ClaudeApiRequest
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;
    
    [JsonPropertyName("max_tokens")]
    public int MaxTokens { get; set; }
    
    [JsonPropertyName("messages")]
    public ClaudeMessage[] Messages { get; set; } = Array.Empty<ClaudeMessage>();
}

public class ClaudeMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
    
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public class ClaudeApiResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
    
    [JsonPropertyName("content")]
    public ClaudeContent[] Content { get; set; } = Array.Empty<ClaudeContent>();
    
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;
    
    [JsonPropertyName("stop_reason")]
    public string StopReason { get; set; } = string.Empty;
    
    [JsonPropertyName("usage")]
    public ClaudeUsage Usage { get; set; } = new();
}

public class ClaudeContent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
    
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class ClaudeUsage
{
    [JsonPropertyName("input_tokens")]
    public int InputTokens { get; set; }
    
    [JsonPropertyName("output_tokens")]
    public int OutputTokens { get; set; }
}