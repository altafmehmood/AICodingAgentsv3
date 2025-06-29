using BreachApi.Models;
using BreachApi.Queries;
using BreachApi.Services;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class GetBreachesQueryHandlerTests
{
    private readonly IHaveIBeenPwnedService _haveIBeenPwnedService;
    private readonly ILogger<GetBreachesQueryHandler> _logger;
    private readonly GetBreachesQueryHandler _handler;

    public GetBreachesQueryHandlerTests()
    {
        _haveIBeenPwnedService = Substitute.For<IHaveIBeenPwnedService>();
        _logger = Substitute.For<ILogger<GetBreachesQueryHandler>>();
        _handler = new GetBreachesQueryHandler(_haveIBeenPwnedService, _logger);
    }

    [Fact]
    public async Task Handle_ShouldCallService_WithCorrectParameters()
    {
        var query = new GetBreachesQuery(new DateTime(2020, 1, 1), new DateTime(2024, 1, 1));
        var expectedBreaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        _haveIBeenPwnedService.GetBreachesAsync(query.From, query.To)
            .Returns(expectedBreaches);

        var result = await _handler.Handle(query, CancellationToken.None);

        await _haveIBeenPwnedService.Received(1).GetBreachesAsync(query.From, query.To);
        Assert.Equal(expectedBreaches, result);
    }

    [Fact]
    public async Task Handle_ShouldPassNullDates_WhenNotProvided()
    {
        var query = new GetBreachesQuery(null, null);
        var expectedBreaches = new List<BreachDto>();

        _haveIBeenPwnedService.GetBreachesAsync(null, null)
            .Returns(expectedBreaches);

        var result = await _handler.Handle(query, CancellationToken.None);

        await _haveIBeenPwnedService.Received(1).GetBreachesAsync(null, null);
        Assert.Equal(expectedBreaches, result);
    }
}

public class GetBreachesPdfQueryHandlerTests
{
    private readonly IHaveIBeenPwnedService _haveIBeenPwnedService;
    private readonly IPdfService _pdfService;
    private readonly ILogger<GetBreachesPdfQueryHandler> _logger;
    private readonly GetBreachesPdfQueryHandler _handler;

    public GetBreachesPdfQueryHandlerTests()
    {
        _haveIBeenPwnedService = Substitute.For<IHaveIBeenPwnedService>();
        _pdfService = Substitute.For<IPdfService>();
        _logger = Substitute.For<ILogger<GetBreachesPdfQueryHandler>>();
        _handler = new GetBreachesPdfQueryHandler(_haveIBeenPwnedService, _pdfService, _logger);
    }

    [Fact]
    public async Task Handle_ShouldGeneratePdf_WithBreachData()
    {
        var query = new GetBreachesPdfQuery(new DateTime(2020, 1, 1), new DateTime(2024, 1, 1));
        var breaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };
        var expectedPdf = new byte[] { 1, 2, 3, 4 };

        _haveIBeenPwnedService.GetBreachesAsync(query.From, query.To)
            .Returns(breaches);
        _pdfService.GeneratePdfAsync(breaches)
            .Returns(expectedPdf);

        var result = await _handler.Handle(query, CancellationToken.None);

        await _haveIBeenPwnedService.Received(1).GetBreachesAsync(query.From, query.To);
        await _pdfService.Received(1).GeneratePdfAsync(breaches);
        Assert.Equal(expectedPdf, result);
    }
}