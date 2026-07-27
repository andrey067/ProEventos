using ErrorOr;
using ProEventos.Services.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services.Interfaces
{
    public interface IRedeSocialService
    {
        Task<ErrorOr<List<RedeSocialDto>>> GetByEventoIdAsync(int eventoId);
        Task<ErrorOr<List<RedeSocialDto>>> SaveByEventoIdAsync(int eventoId, List<RedeSocialDto> models);
        Task<ErrorOr<Success>> DeleteByEventoIdAsync(int eventoId, int redeSocialId);
        Task<ErrorOr<List<RedeSocialDto>>> GetByPalestranteIdAsync(int palestranteId);
        Task<ErrorOr<List<RedeSocialDto>>> SaveByPalestranteIdAsync(int palestranteId, List<RedeSocialDto> models);
        Task<ErrorOr<Success>> DeleteByPalestranteIdAsync(int palestranteId, int redeSocialId);
    }
}
