using ErrorOr;
using ProEventos.Services.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services.Interfaces
{
    public interface IPalestranteService
    {
        Task<ErrorOr<List<PalestranteDto>>> GetAllAsync();
        Task<ErrorOr<PageResultDto<PalestranteDto>>> GetPagedAsync(
            int? page,
            int? pageSize,
            string q = null);
        Task<ErrorOr<PalestranteDto>> GetByIdAsync(int id);
        Task<ErrorOr<PalestranteDto>> GetByUserIdAsync(string userId);
        Task<ErrorOr<PalestranteDto>> AddAsync(PalestranteDto model);
        Task<ErrorOr<PalestranteDto>> UpdateAsync(int id, PalestranteDto model, string callerUserId, bool isOrganizer);
        Task<ErrorOr<Success>> DeleteAsync(int id, string callerUserId, bool isOrganizer);
        Task<ErrorOr<List<PalestranteDto>>> GetByNomeAsync(string nome);
        Task<ErrorOr<List<PalestranteDto>>> GetByTemaAsync(string tema);
        Task<ErrorOr<Success>> AssociateAsync(int eventoId, int palestranteId, string userId);
        Task<ErrorOr<Success>> DisassociateAsync(int eventoId, int palestranteId, string userId);
    }
}
