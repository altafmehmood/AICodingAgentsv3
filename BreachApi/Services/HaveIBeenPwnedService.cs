using BreachApi.Models;
using Flurl.Http;
using LoggingTimings;

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
        using var timer = _logger.Time("HaveIBeenPwned API - Get breaches with filters");
        
        try
        {
            _logger.LogInformation("Fetching breaches from HaveIBeenPwned API with filters - From: {From}, To: {To}", 
                from?.ToString("yyyy-MM-dd") ?? "None", to?.ToString("yyyy-MM-dd") ?? "None");

            BreachDto[] breaches;
            using (var apiTimer = _logger.Time("HaveIBeenPwned API call"))
            {
                breaches = await $"{BaseUrl}/breaches"
                    .GetJsonAsync<BreachDto[]>();
            }

            _logger.LogInformation("HaveIBeenPwned API call completed, received {TotalBreaches} breaches", breaches.Length);

            List<BreachDto> result;
            using (var filterTimer = _logger.Time("Breach filtering and sorting"))
            {
                var filteredBreaches = breaches.AsEnumerable();

                if (from.HasValue)
                {
                    filteredBreaches = filteredBreaches.Where(b => b.BreachDate >= from.Value);
                }

                if (to.HasValue)
                {
                    filteredBreaches = filteredBreaches.Where(b => b.BreachDate <= to.Value);
                }

                result = filteredBreaches
                    .OrderByDescending(b => b.BreachDate)
                    .ToList();
            }

            _logger.LogInformation("Successfully processed breaches - Final count: {FilteredCount}/{TotalCount}", 
                result.Count, breaches.Length);
            
            return result;
        }
        catch (FlurlHttpException ex)
        {
            _logger.LogError(ex, "HaveIBeenPwned API call failed - Status: {StatusCode}, Response: {Response}", 
                ex.StatusCode, await ex.GetResponseStringAsync());
            throw new InvalidOperationException("Failed to retrieve breach data from external API", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while fetching breaches");
            throw;
        }
    }
}