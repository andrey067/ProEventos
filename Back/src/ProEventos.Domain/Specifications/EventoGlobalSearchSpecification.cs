using System;
using System.Linq.Expressions;
using ProEventos.Domain.Entities;

namespace ProEventos.Domain.Specifications
{
    public sealed class EventoGlobalSearchSpecification : ISpecification<Evento>
    {
        public EventoGlobalSearchSpecification(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
                throw new ArgumentException("Search term is required.", nameof(term));

            var termLower = term.Trim().ToLower();
            Criteria = e =>
                (e.Tema != null && e.Tema.ToLower().Contains(termLower)) ||
                (e.Local != null && e.Local.ToLower().Contains(termLower)) ||
                (e.Email != null && e.Email.ToLower().Contains(termLower)) ||
                (e.Telefone != null && e.Telefone.ToLower().Contains(termLower));
        }

        public Expression<Func<Evento, bool>> Criteria { get; }
    }
}
