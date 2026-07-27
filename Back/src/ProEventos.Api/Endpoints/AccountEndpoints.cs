using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class AccountEndpoints
    {
        public static void MapAccountEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/account").WithTags("Account");

            group.MapPost("/register", async ([FromBody] UserRegisterDto model, IAccountService service) =>
            {
                var result = await service.RegisterAsync(model);
                return result.ToHttpResult();
            });

            group.MapPost("/register-palestrante", async ([FromBody] UserRegisterPalestranteDto model, IAccountService service) =>
            {
                var result = await service.RegisterPalestranteAsync(model);
                return result.ToHttpResult();
            });

            group.MapPost("/login", async ([FromBody] UserLoginDto model, IAccountService service) =>
            {
                var result = await service.LoginAsync(model);
                return result.ToHttpResult();
            });

            group.MapPost("/refresh-token", async ([FromBody] RefreshTokenRequestDto model, IAccountService service) =>
            {
                var result = await service.RefreshTokenAsync(model);
                return result.ToHttpResult();
            });

            group.MapGet("/profile", async (ClaimsPrincipal user, IAccountService service) =>
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("sub")
                    ?? user.FindFirstValue(ClaimTypes.Name);
                var result = await service.GetProfileAsync(userId);
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapPut("/profile", async (ClaimsPrincipal user, [FromBody] UserUpdateDto model, IAccountService service) =>
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("sub");
                var result = await service.UpdateProfileAsync(userId, model);
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapPut("/change-password", async (ClaimsPrincipal user, [FromBody] ChangePasswordDto model, IAccountService service) =>
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? user.FindFirstValue("sub");
                var result = await service.ChangePasswordAsync(userId, model);
                return result.ToHttpResult();
            }).RequireAuthorization();
        }
    }
}
