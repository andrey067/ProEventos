using System.Linq;
using ProEventos.Domain.Specifications;

namespace ProEventos.Persistence.Extensions
{
    public static class SpecificationExtensions
    {
        public static IQueryable<T> Where<T>(this IQueryable<T> source, ISpecification<T> specification)
        {
            return source.Where(specification.Criteria);
        }
    }
}
