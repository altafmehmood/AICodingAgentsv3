using BreachApi.Models;

namespace BreachApi.Services;

public interface IPdfService
{
    Task<byte[]> GeneratePdfAsync(IEnumerable<BreachDto> breaches);
}