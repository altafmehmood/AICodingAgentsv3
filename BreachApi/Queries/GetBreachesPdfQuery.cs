using MediatR;

namespace BreachApi.Queries;

public record GetBreachesPdfQuery(DateTime? From, DateTime? To) : IRequest<byte[]>;