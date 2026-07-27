using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class LoteEndpoints
    {
        public static void MapLoteEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/lotes").WithTags("Lotes");

            group.MapGet("/{eventoId:int}", async (int eventoId, ILotesService service) =>
            {
                var result = await service.GetLotesByEventoIdAsync(eventoId);
                return result.ToHttpResult(value => Results.Ok(value ?? new List<LoteDto>()));
            });

            group.MapPut("/{eventoId:int}", async (int eventoId, [FromBody] List<LoteDto> models, ILotesService service) =>
            {
                var result = await service.SaveLotes(eventoId, models ?? new List<LoteDto>());
                return result.ToHttpResult(value => Results.Ok(value ?? new List<LoteDto>()));
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{eventoId:int}/{loteId:int}", async (int eventoId, int loteId, ILotesService service) =>
            {
                var existing = await service.GetLoteByIdsAsync(eventoId, loteId);
                if (existing.IsError)
                    return existing.ToHttpResult();

                var result = await service.DeleteLote(eventoId, loteId);
                return result.ToHttpResult(new { message = "Lote Deletado" });
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);
        }
    }
}
