using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using NetDevPack.Identity.Interfaces;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Services.Services
{
    public class TokenService : ITokenService
    {
        private readonly UserManager<User> _userManager;
        private readonly IJwtBuilder _jwtBuilder;
        private readonly IPalestrantesRepository _palestrantesRepository;

        public TokenService(
            UserManager<User> userManager,
            IJwtBuilder jwtBuilder,
            IPalestrantesRepository palestrantesRepository)
        {
            _userManager = userManager;
            _jwtBuilder = jwtBuilder;
            _palestrantesRepository = palestrantesRepository;
        }

        public async Task<AuthResponseDto> BuildAuthResponseAsync(User user, int? palestranteId = null)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userResponse = await _jwtBuilder
                .WithEmail(user.Email)
                .WithUserId(user.Id)
                .WithJwtClaims()
                .WithUserClaims()
                .WithUserRoles()
                .WithRefreshToken()
                .BuildUserResponse();

            if (palestranteId == null)
            {
                var linked = await _palestrantesRepository.GetPalestranteByUserIdAsync(user.Id);
                palestranteId = linked?.Id;
            }

            return new AuthResponseDto
            {
                Token = userResponse.AccessToken,
                RefreshToken = userResponse.RefreshToken,
                ExpiresIn = userResponse.ExpiresIn,
                UserName = user.UserName,
                Email = user.Email,
                Nome = user.Nome,
                Roles = roles?.ToList() ?? new List<string>(),
                PalestranteId = palestranteId
            };
        }

        public async Task<(bool IsValid, string UserId, string Reason)> ValidateRefreshTokenAsync(string refreshToken)
        {
            var validation = await _jwtBuilder.ValidateRefreshToken(refreshToken);
            return (validation.IsValid, validation.UserId, validation.Reason);
        }
    }
}
