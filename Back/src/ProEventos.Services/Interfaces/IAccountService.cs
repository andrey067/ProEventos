using ErrorOr;
using ProEventos.Services.Dtos;
using System.Threading.Tasks;

namespace ProEventos.Services.Interfaces
{
    public interface IAccountService
    {
        Task<ErrorOr<AuthResponseDto>> RegisterAsync(UserRegisterDto model);
        Task<ErrorOr<AuthResponseDto>> RegisterPalestranteAsync(UserRegisterPalestranteDto model);
        Task<ErrorOr<AuthResponseDto>> LoginAsync(UserLoginDto model);
        Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto model);
        Task<ErrorOr<UserDto>> GetProfileAsync(string userId);
        Task<ErrorOr<UserDto>> UpdateProfileAsync(string userId, UserUpdateDto model);
        Task<ErrorOr<AuthResponseDto>> ChangePasswordAsync(string userId, ChangePasswordDto model);
    }
}
