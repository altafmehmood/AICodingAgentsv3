namespace BreachApi.Services;

public interface IClaudeConfigurationService
{
    Task<string> GetApiKeyAsync();
    string GetApiUrl();
    string GetModel();
    int GetMaxTokens();
}