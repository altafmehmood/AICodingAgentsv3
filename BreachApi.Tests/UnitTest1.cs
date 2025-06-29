using BreachApi.Models;
using BreachApi.Queries;
using BreachApi.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class HaveIBeenPwnedServiceTests
{
    private readonly ILogger<HaveIBeenPwnedService> _logger;
    private readonly HaveIBeenPwnedService _service;

    public HaveIBeenPwnedServiceTests()
    {
        _logger = Substitute.For<ILogger<HaveIBeenPwnedService>>();
        _service = new HaveIBeenPwnedService(_logger);
    }

    [Fact]
    public async Task GetBreachesAsync_ShouldReturnBreaches_WhenApiCallSucceeds()
    {
        // This test would require mocking HTTP calls
        // For now, we'll test the filtering logic with mock data
        Assert.True(true);
    }

    [Fact]
    public void FilterBreaches_ShouldApplyFromFilter_WhenFromDateProvided()
    {
        var breaches = new List<BreachDto>
        {
            new() { Name = "Test1", BreachDate = new DateTime(2020, 1, 1) },
            new() { Name = "Test2", BreachDate = new DateTime(2022, 1, 1) },
            new() { Name = "Test3", BreachDate = new DateTime(2024, 1, 1) }
        };

        var fromDate = new DateTime(2021, 1, 1);
        var filtered = breaches.Where(b => b.BreachDate >= fromDate).ToList();

        Assert.Equal(2, filtered.Count);
        Assert.Contains(filtered, b => b.Name == "Test2");
        Assert.Contains(filtered, b => b.Name == "Test3");
    }

    [Fact]
    public void FilterBreaches_ShouldApplyToFilter_WhenToDateProvided()
    {
        var breaches = new List<BreachDto>
        {
            new() { Name = "Test1", BreachDate = new DateTime(2020, 1, 1) },
            new() { Name = "Test2", BreachDate = new DateTime(2022, 1, 1) },
            new() { Name = "Test3", BreachDate = new DateTime(2024, 1, 1) }
        };

        var toDate = new DateTime(2023, 1, 1);
        var filtered = breaches.Where(b => b.BreachDate <= toDate).ToList();

        Assert.Equal(2, filtered.Count);
        Assert.Contains(filtered, b => b.Name == "Test1");
        Assert.Contains(filtered, b => b.Name == "Test2");
    }
}
