using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Domain.Identity;
using ProEventos.Services.Dtos;
using ProEventos.Services.Helpers;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class PalestranteEndpoints
    {
        public static void MapPalestranteEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/palestrantes").WithTags("Palestrantes");

            group.MapGet("/", async (
                IPalestranteService service,
                int? page,
                int? pageSize,
                string q,
                string nome,
                string tema) =>
            {
                var term = SearchTermResolver.ResolvePalestranteTerm(q, nome, tema);
                var result = await service.GetPagedAsync(page, pageSize, term);
                return result.ToPagedHttpResult();
            });

            group.MapGet("/me", async (ClaimsPrincipal user, IPalestranteService service) =>
            {
                var result = await service.GetByUserIdAsync(GetUserId(user));
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapGet("/nome/{nome}", async (
                string nome,
                IPalestranteService service,
                int? page,
                int? pageSize) =>
            {
                var term = SearchTermResolver.ResolvePalestranteTerm(nome);
                var result = await service.GetPagedAsync(page, pageSize, term);
                return result.ToPagedHttpResult();
            });

            group.MapGet("/tema/{tema}", async (
                string tema,
                IPalestranteService service,
                int? page,
                int? pageSize) =>
            {
                var term = SearchTermResolver.ResolvePalestranteTerm(tema);
                var result = await service.GetPagedAsync(page, pageSize, term);
                return result.ToPagedHttpResult();
            });

            group.MapGet("/{id:int}", async (int id, IPalestranteService service) =>
            {
                var result = await service.GetByIdAsync(id);
                return result.ToHttpResult();
            });

            group.MapPost("/", async (
                ClaimsPrincipal user,
                [FromBody] PalestranteDto model,
                IPalestranteService service) =>
            {
                if (model != null && string.IsNullOrWhiteSpace(model.UserId))
                {
                    model.UserId = GetUserId(user);
                }

                var result = await service.AddAsync(model);
                return result.ToHttpResult();
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapPut("/{id:int}", async (
                int id,
                ClaimsPrincipal user,
                [FromBody] PalestranteDto model,
                IPalestranteService service) =>
            {
                var result = await service.UpdateAsync(
                    id,
                    model,
                    GetUserId(user),
                    IsOrganizer(user));
                return result.ToHttpResult();
            }).RequireAuthorization();

            group.MapDelete("/{id:int}", async (
                int id,
                ClaimsPrincipal user,
                IPalestranteService service) =>
            {
                var result = await service.DeleteAsync(id, GetUserId(user), IsOrganizer(user));
                return result.ToHttpResult(new { message = "Deletado" });
            }).RequireAuthorization();
        }

        private static string GetUserId(ClaimsPrincipal user) =>
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        private static bool IsOrganizer(ClaimsPrincipal user) =>
            user.IsInRole(AppRoles.User);
    }
}
