using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class EventoRepositoryTests
{
    private static async Task<(EventoRepository repo, Evento evento, Palestrante palestrante)> SeedGraphAsync(bool withPalestrante)
    {
        var ctx = DataContextFactory.Create();
        var repo = new EventoRepository(ctx);

        var user = await DataContextFactory.SeedUserAsync(ctx, "ana");
        var palestrante = new Palestrante { Nome = "Ana", Email = "a@b.com", Telefone = "11", UserId = user.Id };
        var evento = new Evento
        {
            Tema = "DotNet Conference",
            Local = "SP",
            Telefone = "11",
            Email = "e@b.com",
            QtdPessoas = 50,
            ImagemURL = "img.jpg",
            Lotes = new List<Lote>
            {
                new() { Nome = "VIP", Preco = 100, Quantidade = 10, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
            },
            RedeSociais = new List<RedeSocial> { new() { Nome = "IG", URL = "https://ig" } }
        };

        ctx.Palestrantes.Add(palestrante);
        ctx.Eventos.Add(evento);
        await ctx.SaveChangesAsync();

        if (withPalestrante)
        {
            ctx.PalestranteEvento.Add(new Palestrante_Evento
            {
                EventoId = evento.Id,
                PalestranteId = palestrante.Id
            });
            await ctx.SaveChangesAsync();
        }

        return (repo, evento, palestrante);
    }

    [Fact]
    public async Task GetAllEventosAsync_Includes_Lotes_And_Redes()
    {
        var (repo, evento, _) = await SeedGraphAsync(false);

        var result = await repo.GetAllEventosAsync(false);

        result.Should().ContainSingle(e => e.Id == evento.Id);
        result[0].Lotes.Should().ContainSingle();
        result[0].RedeSociais.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAllEventosAsync_With_Palestrante_Includes_Navigation()
    {
        var (repo, evento, palestrante) = await SeedGraphAsync(true);

        var result = await repo.GetAllEventosAsync(true);

        var loaded = result.Single(e => e.Id == evento.Id);
        loaded.PalestrantesEventos.Should().ContainSingle(pe => pe.Palestrante.Nome == palestrante.Nome);
    }

    [Fact]
    public async Task GetAllEventosByIdAsync_Finds_By_Id()
    {
        var (repo, evento, _) = await SeedGraphAsync(false);

        var found = await repo.GetAllEventosByIdAsync(evento.Id, false);

        found!.Tema.Should().Be("DotNet Conference");
        found.Lotes.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetAllEventosByIdAsync_With_Palestrante()
    {
        var (repo, evento, palestrante) = await SeedGraphAsync(true);

        var found = await repo.GetAllEventosByIdAsync(evento.Id, true);

        found!.PalestrantesEventos.Should().ContainSingle(pe => pe.PalestranteId == palestrante.Id);
    }

    [Fact]
    public async Task GetAllEventosByTemaAsync_Filters_By_Tema()
    {
        var (repo, evento, _) = await SeedGraphAsync(false);

        var result = await repo.GetAllEventosByTemaAsync("dotnet", true);

        result.Should().ContainSingle(e => e.Id == evento.Id);
    }
}
