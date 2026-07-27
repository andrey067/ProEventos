using System.Threading.Tasks;
using ProEventos.Domain.Entities;
using ProEventos.Services.Dtos;

namespace ProEventos.Services.Interfaces
{
    public interface ITokenService
    {
        Task<AuthResponseDto> BuildAuthResponseAsync(User user, int? palestranteId = null);
        Task<(bool IsValid, string UserId, string Reason)> ValidateRefreshTokenAsync(string refreshToken);
    }
}
