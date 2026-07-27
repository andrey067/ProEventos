using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Interfaces;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class EventoEndpoints
    {
        public static void MapEventoEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/eventos").WithTags("Eventos");

            group.MapGet("/", async (IEventoService service) =>
            {
                var result = await service.GetAllEventosAsync(true);
                return result.ToHttpResult(value => Results.Ok(value ?? new List<EventoDto>()));
            });

            group.MapGet("/{id:int}", async (int id, IEventoService service) =>
            {
                var result = await service.GetAllEventosByIdAsync(id, true);
                return result.ToHttpResult();
            });

            group.MapGet("/tema/{tema}", async (string tema, IEventoService service) =>
            {
                var result = await service.GetAllEventosByTemaAsync(tema, true);
                return result.ToHttpResult(value => Results.Ok(value ?? new List<EventoDto>()));
            });

            group.MapPost("/", async ([FromBody] EventoDto model, IEventoService service) =>
            {
                var result = await service.AddEvento(model);
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapPut("/{id:int}", async (int id, [FromBody] EventoDto model, IEventoService service) =>
            {
                var result = await service.UpdateEvento(id, model);
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{id:int}", async (int id, IEventoService service) =>
            {
                var result = await service.DeleteEvento(id);
                return result.ToHttpResult(new { message = "Deletado" });
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapPut("/{eventoId:int}/palestrantes/{palestranteId:int}",
                async (int eventoId, int palestranteId, IPalestranteService service) =>
                {
                    var result = await service.AssociateAsync(eventoId, palestranteId);
                    return result.ToHttpResult(new { message = "Associado" });
                }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{eventoId:int}/palestrantes/{palestranteId:int}",
                async (int eventoId, int palestranteId, IPalestranteService service) =>
                {
                    var result = await service.DisassociateAsync(eventoId, palestranteId);
                    return result.ToHttpResult(new { message = "Desassociado" });
                }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);
        }
    }
}
