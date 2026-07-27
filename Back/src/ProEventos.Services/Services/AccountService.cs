using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ErrorOr;
using Microsoft.AspNetCore.Identity;
using NetDevPack.Identity.Interfaces;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Identity;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Services.Services
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IJwtBuilder _jwtBuilder;
        private readonly IPalestrantesRepository _palestrantesRepository;

        public AccountService(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            IJwtBuilder jwtBuilder,
            IPalestrantesRepository palestrantesRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtBuilder = jwtBuilder;
            _palestrantesRepository = palestrantesRepository;
        }

        public async Task<ErrorOr<AuthResponseDto>> RegisterAsync(UserRegisterDto model)
        {
            var existingEmail = await _userManager.FindByEmailAsync(model.Email);
            if (existingEmail != null)
                return Error.Conflict("Account.Register.EmailInUse", "Email já está em uso.");

            var existingUser = await _userManager.FindByNameAsync(model.UserName);
            if (existingUser != null)
                return Error.Conflict("Account.Register.UserNameInUse", "UserName já está em uso.");

            var user = new User
            {
                Nome = model.Nome,
                UserName = model.UserName,
                Email = model.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var error = string.Join(" ", result.Errors.Select(e => e.Description));
                return Error.Validation("Account.Register.Failed", error);
            }

            await EnsureRoleExistsAsync(AppRoles.User);
            await _userManager.AddToRoleAsync(user, AppRoles.User);

            return await BuildAuthResponseAsync(user);
        }

        public async Task<ErrorOr<AuthResponseDto>> RegisterPalestranteAsync(UserRegisterPalestranteDto model)
        {
            var existingEmail = await _userManager.FindByEmailAsync(model.Email);
            if (existingEmail != null)
                return Error.Conflict("Account.RegisterPalestrante.EmailInUse", "Email já está em uso.");

            var existingUser = await _userManager.FindByNameAsync(model.UserName);
            if (existingUser != null)
                return Error.Conflict("Account.RegisterPalestrante.UserNameInUse", "UserName já está em uso.");

            var user = new User
            {
                Nome = model.Nome,
                UserName = model.UserName,
                Email = model.Email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, model.Password);
            if (!result.Succeeded)
            {
                var error = string.Join(" ", result.Errors.Select(e => e.Description));
                return Error.Validation("Account.RegisterPalestrante.Failed", error);
            }

            await EnsureRoleExistsAsync(AppRoles.Palestrante);
            await _userManager.AddToRoleAsync(user, AppRoles.Palestrante);

            var palestrante = await _palestrantesRepository.InsertAsync(new Palestrante
            {
                Nome = model.Nome,
                Email = model.Email,
                Telefone = model.Telefone,
                MiniCurriculo = model.MiniCurriculo,
                ImagemURL = model.ImagemURL,
                UserId = user.Id
            });

            return await BuildAuthResponseAsync(user, palestrante.Id);
        }

        public async Task<ErrorOr<AuthResponseDto>> LoginAsync(UserLoginDto model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName);
            if (user == null)
                return Error.Unauthorized("Account.Login.InvalidCredentials", "Credenciais inválidas.");

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
                return Error.Unauthorized("Account.Login.InvalidCredentials", "Credenciais inválidas.");

            return await BuildAuthResponseAsync(user);
        }

        public async Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.RefreshToken))
                return Error.Validation("Account.Refresh.Required", "RefreshToken é obrigatório.");

            var validation = await _jwtBuilder.ValidateRefreshToken(model.RefreshToken);
            if (!validation.IsValid || string.IsNullOrWhiteSpace(validation.UserId))
            {
                var reason = string.IsNullOrWhiteSpace(validation.Reason)
                    ? "Refresh token inválido ou expirado."
                    : validation.Reason;
                return Error.Unauthorized("Account.Refresh.Invalid", reason);
            }

            var user = await _userManager.FindByIdAsync(validation.UserId);
            if (user == null)
                return Error.Unauthorized("Account.Refresh.UserNotFound", "Usuário do refresh token não encontrado.");

            return await BuildAuthResponseAsync(user);
        }

        public async Task<ErrorOr<UserDto>> GetProfileAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.NotFound("Account.Profile.NotFound", "Usuário não encontrado.");
            return ToDto(user);
        }

        public async Task<ErrorOr<UserDto>> UpdateProfileAsync(string userId, UserUpdateDto model)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.NotFound("Account.Update.NotFound", "Usuário não encontrado.");

            if (!string.IsNullOrWhiteSpace(model.Email) &&
                !string.Equals(model.Email, user.Email, System.StringComparison.OrdinalIgnoreCase))
            {
                var emailOwner = await _userManager.FindByEmailAsync(model.Email);
                if (emailOwner != null && emailOwner.Id != user.Id)
                    return Error.Conflict("Account.Update.EmailInUse", "Email já está em uso.");
                user.Email = model.Email;
            }

            if (!string.IsNullOrWhiteSpace(model.UserName) &&
                !string.Equals(model.UserName, user.UserName, System.StringComparison.OrdinalIgnoreCase))
            {
                var nameOwner = await _userManager.FindByNameAsync(model.UserName);
                if (nameOwner != null && nameOwner.Id != user.Id)
                    return Error.Conflict("Account.Update.UserNameInUse", "UserName já está em uso.");
                user.UserName = model.UserName;
            }

            if (!string.IsNullOrWhiteSpace(model.Nome))
                user.Nome = model.Nome;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var error = string.Join(" ", result.Errors.Select(e => e.Description));
                return Error.Validation("Account.Update.Failed", error);
            }

            return ToDto(user);
        }

        public async Task<ErrorOr<Success>> ChangePasswordAsync(string userId, ChangePasswordDto model)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.NotFound("Account.ChangePassword.NotFound", "Usuário não encontrado.");

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                var error = string.Join(" ", result.Errors.Select(e => e.Description));
                return Error.Validation("Account.ChangePassword.Failed", error);
            }

            return Result.Success;
        }

        private async Task EnsureRoleExistsAsync(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        private async Task<AuthResponseDto> BuildAuthResponseAsync(User user, int? palestranteId = null)
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

        private static UserDto ToDto(User user) => new UserDto
        {
            UserName = user.UserName,
            Email = user.Email,
            Nome = user.Nome
        };
    }
}
