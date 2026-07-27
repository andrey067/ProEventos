using System.Threading.Tasks;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces;

namespace ProEventos.Domain.Interfaces.Repositories
{
    public interface IPalestrantesRepository : IRepository<Palestrante>
    {
        Task<System.Collections.Generic.List<Palestrante>> GetAllPalestrantesAsync(bool includeRedes = true);
        Task<Palestrante> GetPalestranteByIdAsync(int id, bool includeRedes = true);
        Task<Palestrante> GetPalestranteByUserIdAsync(string userId);
        Task<Palestrante[]> GetAllPalestrantesByNameAsync(string nome, bool includeEventos);
        Task<System.Collections.Generic.List<Palestrante>> GetAllPalestrantesByTemaAsync(string tema);
        Task<bool> AssociateAsync(int eventoId, int palestranteId);
        Task<bool> DisassociateAsync(int eventoId, int palestranteId);
    }
}
