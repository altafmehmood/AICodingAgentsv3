using BreachApi.Models;
using MediatR;

namespace BreachApi.Queries;

public record GetBreachesQuery(DateTime? From, DateTime? To) : IRequest<IEnumerable<BreachDto>>;