using System;
using System.Linq;
using System.Linq.Expressions;
using ProEventos.Domain.Entities;

namespace ProEventos.Domain.Specifications
{
    public sealed class PalestranteGlobalSearchSpecification : ISpecification<Palestrante>
    {
        public PalestranteGlobalSearchSpecification(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
                throw new ArgumentException("Search term is required.", nameof(term));

            var termLower = term.Trim().ToLower();
            Criteria = p =>
                (p.Nome != null && p.Nome.ToLower().Contains(termLower)) ||
                (p.MiniCurriculo != null && p.MiniCurriculo.ToLower().Contains(termLower)) ||
                (p.Email != null && p.Email.ToLower().Contains(termLower)) ||
                (p.Telefone != null && p.Telefone.ToLower().Contains(termLower)) ||
                (p.PalestrantesEventos != null &&
                 p.PalestrantesEventos.Any(pe =>
                     pe.Evento != null &&
                     pe.Evento.Tema != null &&
                     pe.Evento.Tema.ToLower().Contains(termLower)));
        }

        public Expression<Func<Palestrante, bool>> Criteria { get; }
    }
}
