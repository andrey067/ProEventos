using ErrorOr;
using ProEventos.Services.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Interfaces
{
    public interface IEventoService
    {
        Task<ErrorOr<EventoDto>> Get(int id);
        Task<ErrorOr<IEnumerable<EventoDto>>> GetAll();
        Task<ErrorOr<EventoDto>> AddEvento(EventoDto model, string userId);
        Task<ErrorOr<EventoDto>> UpdateEvento(int eventoId, EventoDto model, string userId);
        Task<ErrorOr<Success>> DeleteEvento(int eventoId, string userId);
        Task<ErrorOr<List<EventoDto>>> GetAllEventosByTemaAsync(string tema, bool includePalestrante);
        Task<ErrorOr<List<EventoDto>>> GetAllEventosAsync(bool includePalestrante = false);
        Task<ErrorOr<PageResultDto<EventoDto>>> GetPagedEventosAsync(
            int? page,
            int? pageSize,
            string q = null,
            bool includePalestrante = false);
        Task<ErrorOr<EventoDto>> GetAllEventosByIdAsync(int eventoId, bool includePalestrante);
    }
}
