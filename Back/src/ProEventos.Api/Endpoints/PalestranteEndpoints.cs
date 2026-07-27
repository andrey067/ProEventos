using Microsoft.AspNetCore.Mvc;
using ProEventos.Api.Extensions;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;

namespace ProEventos.Api.Endpoints
{
    public static class PalestranteEndpoints
    {
        public static void MapPalestranteEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/palestrantes").WithTags("Palestrantes");

            group.MapGet("/", async (IPalestranteService service) =>
            {
                var result = await service.GetAllAsync();
                return result.ToHttpResult();
            });

            group.MapGet("/nome/{nome}", async (string nome, IPalestranteService service) =>
            {
                var result = await service.GetByNomeAsync(nome);
                return result.ToHttpResult();
            });

            group.MapGet("/tema/{tema}", async (string tema, IPalestranteService service) =>
            {
                var result = await service.GetByTemaAsync(tema);
                return result.ToHttpResult();
            });

            group.MapGet("/{id:int}", async (int id, IPalestranteService service) =>
            {
                var result = await service.GetByIdAsync(id);
                return result.ToHttpResult();
            });

            group.MapPost("/", async ([FromBody] PalestranteDto model, IPalestranteService service) =>
            {
                var result = await service.AddAsync(model);
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapPut("/{id:int}", async (int id, [FromBody] PalestranteDto model, IPalestranteService service) =>
            {
                var result = await service.UpdateAsync(id, model);
                return result.ToHttpResult();
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);

            group.MapDelete("/{id:int}", async (int id, IPalestranteService service) =>
            {
                var result = await service.DeleteAsync(id);
                return result.ToHttpResult(new { message = "Deletado" });
            }).RequireAuthorization(ProEventos.Domain.Identity.AppRoles.RequireUserRolePolicy);
        }
    }
}
