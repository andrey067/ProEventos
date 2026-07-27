using System.Linq;
using System.Threading.Tasks;
using ErrorOr;
using Microsoft.AspNetCore.Identity;
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
        private readonly ITokenService _tokenService;
        private readonly IPalestrantesRepository _palestrantesRepository;

        public AccountService(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            ITokenService tokenService,
            IPalestrantesRepository palestrantesRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
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

            return await _tokenService.BuildAuthResponseAsync(user);
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

            return await _tokenService.BuildAuthResponseAsync(user, palestrante.Id);
        }

        public async Task<ErrorOr<AuthResponseDto>> LoginAsync(UserLoginDto model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName);
            if (user == null)
                return Error.Unauthorized("Account.Login.InvalidCredentials", "Credenciais inválidas.");

            if (!await _userManager.CheckPasswordAsync(user, model.Password))
                return Error.Unauthorized("Account.Login.InvalidCredentials", "Credenciais inválidas.");

            return await _tokenService.BuildAuthResponseAsync(user);
        }

        public async Task<ErrorOr<AuthResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.RefreshToken))
                return Error.Validation("Account.Refresh.Required", "RefreshToken é obrigatório.");

            var (isValid, userId, reason) = await _tokenService.ValidateRefreshTokenAsync(model.RefreshToken);
            if (!isValid || string.IsNullOrWhiteSpace(userId))
            {
                var message = string.IsNullOrWhiteSpace(reason)
                    ? "Refresh token inválido ou expirado."
                    : reason;
                return Error.Unauthorized("Account.Refresh.Invalid", message);
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.Unauthorized("Account.Refresh.UserNotFound", "Usuário do refresh token não encontrado.");

            return await _tokenService.BuildAuthResponseAsync(user);
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

        public async Task<ErrorOr<AuthResponseDto>> ChangePasswordAsync(string userId, ChangePasswordDto model)
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

            // ChangePassword already updates SecurityStamp; rotate JWT pair so prior
            // refresh tokens fail OneTime LastRefreshToken validation.
            await _userManager.UpdateSecurityStampAsync(user);
            return await _tokenService.BuildAuthResponseAsync(user);
        }

        private async Task EnsureRoleExistsAsync(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        private static UserDto ToDto(User user) => new UserDto
        {
            UserName = user.UserName,
            Email = user.Email,
            Nome = user.Nome
        };
    }
}
