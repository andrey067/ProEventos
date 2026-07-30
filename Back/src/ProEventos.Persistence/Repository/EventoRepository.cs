using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Domain.Specifications;
using ProEventos.Persistence.Extensions;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProEventos.Persistence.Repository
{
    public class EventoRepository : BaseRepository<Evento>, IEventoRepository
    {
        private readonly DbSet<Evento> _eventoContext;
        public EventoRepository(DataContext context) : base(context) => _eventoContext = context.Set<Evento>();

        public async Task<List<Evento>> GetAllEventosAsync(bool includePalestrante = false)
        {
            IQueryable<Evento> query = _eventoContext
                                    .Include(e => e.Lotes)
                                    .Include(e => e.RedeSociais);

            if (includePalestrante)
            {
                query = query
                .Include(e => e.PalestrantesEventos)
                .ThenInclude(pe => pe.Palestrante);
            }

            return await query.ToListAsync();
        }

        public async Task<Evento> GetAllEventosByIdAsync(int EventoId, bool includePalestrante)
        {
            IQueryable<Evento> query = _eventoContext
                                    .Include(e => e.Lotes)
                                    .Include(e => e.RedeSociais);

            if (includePalestrante)
            {
                query = query
                .Include(e => e.PalestrantesEventos)
                .ThenInclude(pe => pe.Palestrante);
            }

            query = query.OrderBy(e => e.Id)
                         .Where(ev => ev.Id == EventoId);

            return await query.FirstOrDefaultAsync();
        }

        public async Task<List<Evento>> GetAllEventosByTemaAsync(string tema, bool includePalestrante)
        {
            IQueryable<Evento> query = _eventoContext
                                    .Include(e => e.Lotes)
                                    .Include(e => e.RedeSociais);

            if (includePalestrante)
            {
                query = query
                .Include(e => e.PalestrantesEventos)
                .ThenInclude(pe => pe.Palestrante);
            }

            if (!string.IsNullOrWhiteSpace(tema))
                query = query.Where(new EventoGlobalSearchSpecification(tema));

            return await query.OrderBy(e => e.Id).ToListAsync();
        }

        public async Task<(List<Evento> Items, int TotalCount)> GetPagedEventosAsync(
            int page,
            int pageSize,
            string q = null,
            bool includePalestrante = false,
            string userId = null)
        {
            IQueryable<Evento> query = _eventoContext.AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(e => e.UserId == userId);

            if (!string.IsNullOrWhiteSpace(q))
                query = query.Where(new EventoGlobalSearchSpecification(q));

            var totalCount = await query.CountAsync();

            query = query
                .Include(e => e.Lotes)
                .Include(e => e.RedeSociais);

            if (includePalestrante)
            {
                query = query
                    .Include(e => e.PalestrantesEventos)
                    .ThenInclude(pe => pe.Palestrante);
            }

            var items = await query
                .OrderBy(e => e.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }
    }
}
