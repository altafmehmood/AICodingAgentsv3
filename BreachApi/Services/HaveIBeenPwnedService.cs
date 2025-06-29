using BreachApi.Models;
using Flurl.Http;

namespace BreachApi.Services;

public class HaveIBeenPwnedService : IHaveIBeenPwnedService
{
    private readonly ILogger<HaveIBeenPwnedService> _logger;
    private const string BaseUrl = "https://haveibeenpwned.com/api/v3";

    public HaveIBeenPwnedService(ILogger<HaveIBeenPwnedService> logger)
    {
        _logger = logger;
    }

    public async Task<IEnumerable<BreachDto>> GetBreachesAsync(DateTime? from = null, DateTime? to = null)
    {
        try
        {
            _logger.LogInformation("Fetching breaches from HaveIBeenPwned API");

            var breaches = await $"{BaseUrl}/breaches"
                .GetJsonAsync<BreachDto[]>();

            var filteredBreaches = breaches.AsEnumerable();

            if (from.HasValue)
            {
                filteredBreaches = filteredBreaches.Where(b => b.BreachDate >= from.Value);
            }

            if (to.HasValue)
            {
                filteredBreaches = filteredBreaches.Where(b => b.BreachDate <= to.Value);
            }

            var result = filteredBreaches
                .OrderByDescending(b => b.BreachDate)
                .ToList();

            _logger.LogInformation("Successfully retrieved {Count} breaches", result.Count);
            
            return result;
        }
        catch (FlurlHttpException ex)
        {
            _logger.LogError(ex, "Error calling HaveIBeenPwned API");
            throw new InvalidOperationException("Failed to retrieve breach data from external API", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching breaches");
            throw;
        }
    }
}