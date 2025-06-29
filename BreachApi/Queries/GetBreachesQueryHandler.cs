using BreachApi.Models;
using BreachApi.Services;
using MediatR;

namespace BreachApi.Queries;

public class GetBreachesQueryHandler : IRequestHandler<GetBreachesQuery, IEnumerable<BreachDto>>
{
    private readonly IHaveIBeenPwnedService _haveIBeenPwnedService;
    private readonly ILogger<GetBreachesQueryHandler> _logger;

    public GetBreachesQueryHandler(
        IHaveIBeenPwnedService haveIBeenPwnedService,
        ILogger<GetBreachesQueryHandler> logger)
    {
        _haveIBeenPwnedService = haveIBeenPwnedService;
        _logger = logger;
    }

    public async Task<IEnumerable<BreachDto>> Handle(GetBreachesQuery request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing GetBreachesQuery with From: {From}, To: {To}", 
            request.From, request.To);

        var breaches = await _haveIBeenPwnedService.GetBreachesAsync(request.From, request.To);
        
        _logger.LogInformation("GetBreachesQuery completed. Returned {Count} breaches", breaches.Count());
        
        return breaches;
    }
}