using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Domain.Identity;
using ProEventos.Interfaces;
using ProEventos.Services.Dtos;
using ProEventos.Services.Helpers;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class EventoEndpoints
    {
        public static void MapEventoEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/eventos").WithTags("Eventos");

            group.MapGet("/", async (
                IEventoService service,
                int? page,
                int? pageSize,
                string q,
                string tema) =>
            {
                var term = SearchTermResolver.ResolveEventoTerm(q, tema);
                var result = await service.GetPagedEventosAsync(page, pageSize, term, includePalestrante: true);
                return result.ToPagedHttpResult();
            });

            group.MapGet("/{id:int}", async (int id, IEventoService service) =>
            {
                var result = await service.GetAllEventosByIdAsync(id, true);
                return result.ToHttpResult();
            });

            group.MapGet("/tema/{tema}", async (
                string tema,
                IEventoService service,
                int? page,
                int? pageSize) =>
            {
                var term = SearchTermResolver.ResolveEventoTerm(tema);
                var result = await service.GetPagedEventosAsync(page, pageSize, term, includePalestrante: true);
                return result.ToPagedHttpResult();
            });

            group.MapPost("/", async (
                ClaimsPrincipal user,
                [FromBody] EventoDto model,
                IEventoService service) =>
            {
                var result = await service.AddEvento(model, GetUserId(user));
                return result.ToHttpResult();
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapPut("/{id:int}", async (
                int id,
                ClaimsPrincipal user,
                [FromBody] EventoDto model,
                IEventoService service) =>
            {
                var result = await service.UpdateEvento(id, model, GetUserId(user));
                return result.ToHttpResult();
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{id:int}", async (
                int id,
                ClaimsPrincipal user,
                IEventoService service) =>
            {
                var result = await service.DeleteEvento(id, GetUserId(user));
                return result.ToHttpResult(new { message = "Deletado" });
            }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapPut("/{eventoId:int}/palestrantes/{palestranteId:int}",
                async (int eventoId, int palestranteId, IPalestranteService service) =>
                {
                    var result = await service.AssociateAsync(eventoId, palestranteId);
                    return result.ToHttpResult(new { message = "Associado" });
                }).RequireAuthorization(AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{eventoId:int}/palestrantes/{palestranteId:int}",
                async (int eventoId, int palestranteId, IPalestranteService service) =>
                {
                    var result = await service.DisassociateAsync(eventoId, palestranteId);
                    return result.ToHttpResult(new { message = "Desassociado" });
                }).RequireAuthorization(AppRoles.RequireUserRolePolicy);
        }

        private static string GetUserId(ClaimsPrincipal user) =>
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");
    }
}
