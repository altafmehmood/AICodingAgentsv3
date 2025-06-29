using BreachApi.Controllers;
using BreachApi.Models;
using BreachApi.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace BreachApi.Tests;

public class BreachControllerTests
{
    private readonly IMediator _mediator;
    private readonly ILogger<BreachController> _logger;
    private readonly BreachController _controller;

    public BreachControllerTests()
    {
        _mediator = Substitute.For<IMediator>();
        _logger = Substitute.For<ILogger<BreachController>>();
        _controller = new BreachController(_mediator, _logger);
    }

    [Fact]
    public async Task GetBreaches_ShouldReturnOkResult_WithBreaches()
    {
        var request = new BreachQueryRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        var expectedBreaches = new List<BreachDto>
        {
            new() { Name = "Test Breach", BreachDate = new DateTime(2022, 1, 1) }
        };

        _mediator.Send(Arg.Any<GetBreachesQuery>())
            .Returns(expectedBreaches);

        var result = await _controller.GetBreaches(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(expectedBreaches, okResult.Value);
    }

    [Fact]
    public async Task GetBreachesPdf_ShouldReturnFileResult_WithPdf()
    {
        var request = new BreachPdfRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        var expectedPdf = new byte[] { 1, 2, 3, 4 };

        _mediator.Send(Arg.Any<GetBreachesPdfQuery>())
            .Returns(expectedPdf);

        var result = await _controller.GetBreachesPdf(request);

        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.Equal(expectedPdf, fileResult.FileContents);
        Assert.Contains("breach-report-", fileResult.FileDownloadName);
    }

    [Fact]
    public async Task GetBreaches_ShouldSendCorrectQuery_ToMediator()
    {
        var request = new BreachQueryRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        await _controller.GetBreaches(request);

        await _mediator.Received(1).Send(
            Arg.Is<GetBreachesQuery>(q => 
                q.From == request.From && 
                q.To == request.To));
    }

    [Fact]
    public async Task GetBreachesPdf_ShouldSendCorrectQuery_ToMediator()
    {
        var request = new BreachPdfRequest
        {
            From = new DateTime(2020, 1, 1),
            To = new DateTime(2024, 1, 1)
        };

        await _controller.GetBreachesPdf(request);

        await _mediator.Received(1).Send(
            Arg.Is<GetBreachesPdfQuery>(q => 
                q.From == request.From && 
                q.To == request.To));
    }
}