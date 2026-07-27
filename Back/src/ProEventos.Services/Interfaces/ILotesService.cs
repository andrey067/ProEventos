using ErrorOr;
using ProEventos.Services.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services.Interfaces
{
    public interface ILotesService
    {
        Task<ErrorOr<Success>> AddLote(int eventoId, LoteDto model);
        Task<ErrorOr<List<LoteDto>>> SaveLotes(int eventoId, List<LoteDto> models);
        Task<ErrorOr<Success>> DeleteLote(int eventoId, int loteId);

        Task<ErrorOr<List<LoteDto>>> GetLotesByEventoIdAsync(int eventoId);
        Task<ErrorOr<LoteDto>> GetLoteByIdsAsync(int eventoId, int loteId);
    }
}
