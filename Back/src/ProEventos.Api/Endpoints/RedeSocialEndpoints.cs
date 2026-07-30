using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Domain.Identity;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class RedeSocialEndpoints
    {
        public static void MapRedeSocialEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/redes-sociais").WithTags("RedesSociais");

            group.MapGet("/evento/{eventoId:int}", async (int eventoId, IRedeSocialService service) =>
            {
                var result = await service.GetByEventoIdAsync(eventoId);
                return result.ToHttpResult();
            });

            group.MapPut("/evento/{eventoId:int}", async (
                int eventoId,
                ClaimsPrincipal user,
                [FromBody] List<RedeSocialDto> models,
                IRedeSocialService service) =>
            {
                var result = await service.SaveByEventoIdAsync(
                    eventoId,
                    models ?? new List<RedeSocialDto>(),
                    GetUserId(user));
                return result.ToHttpResult();
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapDelete("/evento/{eventoId:int}/{redeSocialId:int}", async (
                int eventoId,
                int redeSocialId,
                ClaimsPrincipal user,
                IRedeSocialService service) =>
            {
                var result = await service.DeleteByEventoIdAsync(eventoId, redeSocialId, GetUserId(user));
                return result.ToHttpResult(new { message = "Rede social deletada" });
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            // Self-scoped palestrante (must be registered before /palestrante/{id})
            group.MapGet("/palestrante", async (ClaimsPrincipal user, IRedeSocialService service) =>
            {
                var result = await service.GetMineByUserIdAsync(GetUserId(user));
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapPut("/palestrante", async (
                ClaimsPrincipal user,
                [FromBody] List<RedeSocialDto> models,
                IRedeSocialService service) =>
            {
                var result = await service.SaveMineByUserIdAsync(
                    GetUserId(user),
                    models ?? new List<RedeSocialDto>());
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapDelete("/palestrante/{redeSocialId:int}", async (
                int redeSocialId,
                ClaimsPrincipal user,
                IRedeSocialService service) =>
            {
                var result = await service.DeleteMineByUserIdAsync(GetUserId(user), redeSocialId);
                return result.ToHttpResult(new { message = "Rede social deletada" });
            }).RequireAuthorization();

            group.MapGet("/palestrante/{palestranteId:int}", async (int palestranteId, IRedeSocialService service) =>
            {
                var result = await service.GetByPalestranteIdAsync(palestranteId);
                return result.ToHttpResult();
            });

            group.MapPut("/palestrante/{palestranteId:int}", async (
                int palestranteId,
                ClaimsPrincipal user,
                [FromBody] List<RedeSocialDto> models,
                IRedeSocialService service) =>
            {
                var gate = await service.EnsureCanMutatePalestranteRedesAsync(
                    palestranteId,
                    GetUserId(user),
                    IsOrganizer(user));
                if (gate.IsError)
                    return gate.ToHttpResult();

                var result = await service.SaveByPalestranteIdAsync(
                    palestranteId,
                    models ?? new List<RedeSocialDto>());
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapDelete("/palestrante/{palestranteId:int}/{redeSocialId:int}", async (
                int palestranteId,
                int redeSocialId,
                ClaimsPrincipal user,
                IRedeSocialService service) =>
            {
                var gate = await service.EnsureCanMutatePalestranteRedesAsync(
                    palestranteId,
                    GetUserId(user),
                    IsOrganizer(user));
                if (gate.IsError)
                    return gate.ToHttpResult();

                var result = await service.DeleteByPalestranteIdAsync(palestranteId, redeSocialId);
                return result.ToHttpResult(new { message = "Rede social deletada" });
            }).RequireAuthorization();
        }

        private static string GetUserId(ClaimsPrincipal user) =>
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        private static bool IsOrganizer(ClaimsPrincipal user) =>
            user.IsInRole(AppRoles.User);
    }
}
