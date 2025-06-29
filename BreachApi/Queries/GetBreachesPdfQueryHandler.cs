using BreachApi.Services;
using MediatR;

namespace BreachApi.Queries;

public class GetBreachesPdfQueryHandler : IRequestHandler<GetBreachesPdfQuery, byte[]>
{
    private readonly IHaveIBeenPwnedService _haveIBeenPwnedService;
    private readonly IPdfService _pdfService;
    private readonly ILogger<GetBreachesPdfQueryHandler> _logger;

    public GetBreachesPdfQueryHandler(
        IHaveIBeenPwnedService haveIBeenPwnedService,
        IPdfService pdfService,
        ILogger<GetBreachesPdfQueryHandler> logger)
    {
        _haveIBeenPwnedService = haveIBeenPwnedService;
        _pdfService = pdfService;
        _logger = logger;
    }

    public async Task<byte[]> Handle(GetBreachesPdfQuery request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing GetBreachesPdfQuery with From: {From}, To: {To}", 
            request.From, request.To);

        var breaches = await _haveIBeenPwnedService.GetBreachesAsync(request.From, request.To);
        var pdfBytes = await _pdfService.GeneratePdfAsync(breaches);
        
        _logger.LogInformation("GetBreachesPdfQuery completed. Generated PDF with {Size} bytes", pdfBytes.Length);
        
        return pdfBytes;
    }
}