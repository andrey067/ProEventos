using ErrorOr;
using ProEventos.Services.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services.Interfaces
{
    public interface IPalestranteService
    {
        Task<ErrorOr<List<PalestranteDto>>> GetAllAsync();
        Task<ErrorOr<PalestranteDto>> GetByIdAsync(int id);
        Task<ErrorOr<PalestranteDto>> AddAsync(PalestranteDto model);
        Task<ErrorOr<PalestranteDto>> UpdateAsync(int id, PalestranteDto model);
        Task<ErrorOr<Success>> DeleteAsync(int id);
        Task<ErrorOr<List<PalestranteDto>>> GetByNomeAsync(string nome);
        Task<ErrorOr<List<PalestranteDto>>> GetByTemaAsync(string tema);
        Task<ErrorOr<Success>> AssociateAsync(int eventoId, int palestranteId);
        Task<ErrorOr<Success>> DisassociateAsync(int eventoId, int palestranteId);
    }
}
