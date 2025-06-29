using BreachApi.Models;

namespace BreachApi.Services;

public interface IHaveIBeenPwnedService
{
    Task<IEnumerable<BreachDto>> GetBreachesAsync(DateTime? from = null, DateTime? to = null);
}