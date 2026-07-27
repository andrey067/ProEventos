using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
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

            group.MapPut("/evento/{eventoId:int}", async (int eventoId, [FromBody] List<RedeSocialDto> models, IRedeSocialService service) =>
            {
                var result = await service.SaveByEventoIdAsync(eventoId, models ?? new List<RedeSocialDto>());
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/evento/{eventoId:int}/{redeSocialId:int}", async (int eventoId, int redeSocialId, IRedeSocialService service) =>
            {
                var result = await service.DeleteByEventoIdAsync(eventoId, redeSocialId);
                return result.ToHttpResult(new { message = "Rede social deletada" });
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapGet("/palestrante/{palestranteId:int}", async (int palestranteId, IRedeSocialService service) =>
            {
                var result = await service.GetByPalestranteIdAsync(palestranteId);
                return result.ToHttpResult();
            });

            group.MapPut("/palestrante/{palestranteId:int}", async (int palestranteId, [FromBody] List<RedeSocialDto> models, IRedeSocialService service) =>
            {
                var result = await service.SaveByPalestranteIdAsync(palestranteId, models ?? new List<RedeSocialDto>());
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/palestrante/{palestranteId:int}/{redeSocialId:int}", async (int palestranteId, int redeSocialId, IRedeSocialService service) =>
            {
                var result = await service.DeleteByPalestranteIdAsync(palestranteId, redeSocialId);
                return result.ToHttpResult(new { message = "Rede social deletada" });
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);
        }
    }
}
