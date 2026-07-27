using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces.Repositories;

namespace ProEventos.Persistence.Repository
{
    public class PalestrantesRepository : BaseRepository<Palestrante>, IPalestrantesRepository
    {
        private readonly DataContext _db;
        private readonly DbSet<Palestrante> _set;

        public PalestrantesRepository(DataContext context) : base(context)
        {
            _db = context;
            _set = context.Set<Palestrante>();
        }

        public async Task<List<Palestrante>> GetAllPalestrantesAsync(bool includeRedes = true)
        {
            IQueryable<Palestrante> query = _set;
            if (includeRedes)
                query = query.Include(p => p.RedeSociais);
            return await query.AsNoTracking().OrderBy(p => p.Id).ToListAsync();
        }

        public async Task<Palestrante> GetPalestranteByIdAsync(int id, bool includeRedes = true)
        {
            IQueryable<Palestrante> query = _set.Where(p => p.Id == id);
            if (includeRedes)
                query = query.Include(p => p.RedeSociais);
            return await query.AsNoTracking().FirstOrDefaultAsync();
        }

        public async Task<Palestrante> GetPalestranteByUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return null;
            return await _set.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<Palestrante[]> GetAllPalestrantesByNameAsync(string nome, bool includeEventos)
        {
            IQueryable<Palestrante> query = _set.Where(p => p.Nome.ToLower().Contains(nome.ToLower()));
            if (includeEventos)
                query = query.Include(p => p.PalestrantesEventos).ThenInclude(pe => pe.Evento);
            return await query.AsNoTracking().ToArrayAsync();
        }

        public async Task<List<Palestrante>> GetAllPalestrantesByTemaAsync(string tema)
        {
            var temaLower = tema.ToLower();
            return await _set
                .Where(p => p.PalestrantesEventos.Any(pe => pe.Evento.Tema.ToLower().Contains(temaLower)))
                .Include(p => p.RedeSociais)
                .Include(p => p.PalestrantesEventos).ThenInclude(pe => pe.Evento)
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .ToListAsync();
        }

        public async Task<bool> AssociateAsync(int eventoId, int palestranteId)
        {
            var exists = await _db.PalestranteEvento
                .AnyAsync(pe => pe.EventoId == eventoId && pe.PalestranteId == palestranteId);
            if (exists) return true;

            var eventoOk = await _db.Eventos.AnyAsync(e => e.Id == eventoId);
            var palestranteOk = await _set.AnyAsync(p => p.Id == palestranteId);
            if (!eventoOk || !palestranteOk) return false;

            await _db.PalestranteEvento.AddAsync(new Palestrante_Evento
            {
                EventoId = eventoId,
                PalestranteId = palestranteId
            });
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DisassociateAsync(int eventoId, int palestranteId)
        {
            var link = await _db.PalestranteEvento
                .FirstOrDefaultAsync(pe => pe.EventoId == eventoId && pe.PalestranteId == palestranteId);
            if (link == null) return false;
            _db.PalestranteEvento.Remove(link);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
