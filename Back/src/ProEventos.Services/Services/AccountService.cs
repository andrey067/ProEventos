using System;
using System.Linq;
using System.Threading.Tasks;
using ErrorOr;
using Microsoft.AspNetCore.Identity;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Enum;
using ProEventos.Domain.Identity;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Domain.Helpers;
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

            var (primeiro, ultimo) = SplitNome(model.Nome);
            var user = new User
            {
                Nome = BuildNome(primeiro, ultimo),
                PrimeiroNome = primeiro,
                UltimoNome = ultimo,
                Titulo = Titulo.NaoInformado,
                Funcao = Funcao.Participante,
                ImagemURL = UnsplashPortraitPicker.Next(),
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

            var (primeiro, ultimo) = SplitNome(model.Nome);
            var portrait = UnsplashPortraitPicker.Next();
            var user = new User
            {
                Nome = BuildNome(primeiro, ultimo),
                PrimeiroNome = primeiro,
                UltimoNome = ultimo,
                Titulo = Titulo.NaoInformado,
                Funcao = Funcao.Palestrante,
                Telefone = model.Telefone,
                ImagemURL = portrait,
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
                Nome = user.Nome,
                Email = model.Email,
                Telefone = model.Telefone,
                MiniCurriculo = model.MiniCurriculo,
                ImagemURL = string.IsNullOrWhiteSpace(model.ImagemURL) ? portrait : model.ImagemURL,
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
            return await ToDtoAsync(user);
        }

        public async Task<ErrorOr<UserDto>> UpdateProfileAsync(string userId, UserUpdateDto model)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.NotFound("Account.Update.NotFound", "Usuário não encontrado.");

            if (string.IsNullOrWhiteSpace(model.PrimeiroNome))
                return Error.Validation("Account.Update.PrimeiroNome", "Primeiro nome é obrigatório.");
            if (string.IsNullOrWhiteSpace(model.UltimoNome))
                return Error.Validation("Account.Update.UltimoNome", "Último nome é obrigatório.");
            if (string.IsNullOrWhiteSpace(model.Email))
                return Error.Validation("Account.Update.Email", "E-mail é obrigatório.");
            if (string.IsNullOrWhiteSpace(model.Telefone))
                return Error.Validation("Account.Update.Telefone", "Telefone é obrigatório.");
            if (string.IsNullOrWhiteSpace(model.Descricao))
                return Error.Validation("Account.Update.Descricao", "Descrição é obrigatória.");

            if (!string.Equals(model.Email, user.Email, StringComparison.OrdinalIgnoreCase))
            {
                var emailOwner = await _userManager.FindByEmailAsync(model.Email);
                if (emailOwner != null && emailOwner.Id != user.Id)
                    return Error.Conflict("Account.Update.EmailInUse", "Email já está em uso.");
                user.Email = model.Email.Trim();
            }

            if (!string.IsNullOrWhiteSpace(model.UserName) &&
                !string.Equals(model.UserName, user.UserName, StringComparison.OrdinalIgnoreCase))
            {
                var nameOwner = await _userManager.FindByNameAsync(model.UserName);
                if (nameOwner != null && nameOwner.Id != user.Id)
                    return Error.Conflict("Account.Update.UserNameInUse", "UserName já está em uso.");
                user.UserName = model.UserName.Trim();
            }

            user.PrimeiroNome = model.PrimeiroNome.Trim();
            user.UltimoNome = model.UltimoNome.Trim();
            user.Nome = BuildNome(user.PrimeiroNome, user.UltimoNome);
            user.Titulo = model.Titulo;
            user.Funcao = model.Funcao;
            user.Telefone = model.Telefone.Trim();
            user.Descricao = model.Descricao.Trim();

            if (model.ImagemURL != null)
            {
                if (string.IsNullOrWhiteSpace(model.ImagemURL))
                {
                    user.ImagemURL = null;
                }
                else
                {
                    var url = model.ImagemURL.Trim();
                    if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                        uri.Scheme != Uri.UriSchemeHttps)
                    {
                        return Error.Validation("Account.Update.ImagemURL", "ImagemURL deve ser uma URL https absoluta.");
                    }
                    user.ImagemURL = url;
                }
            }

            if (model.Funcao == Funcao.Palestrante)
            {
                var ensure = await EnsurePalestranteProfileAsync(user);
                if (ensure.IsError)
                    return ensure.Errors;
            }

            if (!string.IsNullOrWhiteSpace(model.Password))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var reset = await _userManager.ResetPasswordAsync(user, token, model.Password);
                if (!reset.Succeeded)
                {
                    var error = string.Join(" ", reset.Errors.Select(e => e.Description));
                    return Error.Validation("Account.Update.PasswordFailed", error);
                }
                await _userManager.UpdateSecurityStampAsync(user);
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var error = string.Join(" ", result.Errors.Select(e => e.Description));
                return Error.Validation("Account.Update.Failed", error);
            }

            return await ToDtoAsync(user);
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

            await _userManager.UpdateSecurityStampAsync(user);
            return await _tokenService.BuildAuthResponseAsync(user);
        }

        private async Task<ErrorOr<Success>> EnsurePalestranteProfileAsync(User user)
        {
            var linked = await _palestrantesRepository.GetPalestranteByUserIdAsync(user.Id);
            if (linked == null)
            {
                await _palestrantesRepository.InsertAsync(new Palestrante
                {
                    Nome = user.Nome,
                    Email = user.Email,
                    Telefone = user.Telefone,
                    ImagemURL = user.ImagemURL,
                    UserId = user.Id
                });
            }

            await EnsureRoleExistsAsync(AppRoles.Palestrante);
            if (await _userManager.IsInRoleAsync(user, AppRoles.User))
                await _userManager.RemoveFromRoleAsync(user, AppRoles.User);
            if (!await _userManager.IsInRoleAsync(user, AppRoles.Palestrante))
                await _userManager.AddToRoleAsync(user, AppRoles.Palestrante);

            return Result.Success;
        }

        private async Task EnsureRoleExistsAsync(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
                await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        private async Task<UserDto> ToDtoAsync(User user)
        {
            EnsureNameParts(user);
            var palestrante = await _palestrantesRepository.GetPalestranteByUserIdAsync(user.Id);
            var ministrados = palestrante != null
                ? await _palestrantesRepository.CountEventosByPalestranteIdAsync(palestrante.Id)
                : 0;

            return new UserDto
            {
                UserName = user.UserName,
                Email = user.Email,
                Nome = user.Nome ?? BuildNome(user.PrimeiroNome, user.UltimoNome),
                PrimeiroNome = user.PrimeiroNome,
                UltimoNome = user.UltimoNome,
                Titulo = user.Titulo,
                Funcao = user.Funcao,
                Telefone = user.Telefone,
                Descricao = user.Descricao,
                ImagemURL = user.ImagemURL,
                EventosMinistrados = ministrados,
                EventosParticipados = 0
            };
        }

        private static void EnsureNameParts(User user)
        {
            if (string.IsNullOrWhiteSpace(user.PrimeiroNome) && !string.IsNullOrWhiteSpace(user.Nome))
            {
                var (p, u) = SplitNome(user.Nome);
                user.PrimeiroNome = p;
                user.UltimoNome = u;
            }
        }

        internal static (string Primeiro, string Ultimo) SplitNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome))
                return ("", "");
            var parts = nome.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 1)
                return (parts[0], parts[0]);
            return (parts[0], parts[1]);
        }

        internal static string BuildNome(string primeiro, string ultimo)
        {
            var p = (primeiro ?? "").Trim();
            var u = (ultimo ?? "").Trim();
            if (string.IsNullOrEmpty(p)) return u;
            if (string.IsNullOrEmpty(u) || string.Equals(p, u, StringComparison.Ordinal))
                return p;
            return $"{p} {u}";
        }
    }
}
