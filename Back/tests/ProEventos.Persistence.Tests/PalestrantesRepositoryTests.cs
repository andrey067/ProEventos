using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class PalestrantesRepositoryTests
{
    [Fact]
    public async Task GetAllPalestrantesAsync_With_And_Without_Redes()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var user = await DataContextFactory.SeedUserAsync(ctx, "bia");
        var p = new Palestrante
        {
            Nome = "Bia",
            UserId = user.Id,
            RedeSociais = new List<RedeSocial> { new() { Nome = "LI", URL = "https://li" } }
        };
        ctx.Palestrantes.Add(p);
        await ctx.SaveChangesAsync();

        var withRedes = await repo.GetAllPalestrantesAsync(true);
        withRedes.Should().ContainSingle(x => x.Nome == "Bia");
        withRedes[0].RedeSociais.Should().ContainSingle();

        var withoutRedes = await repo.GetAllPalestrantesAsync(false);
        withoutRedes.Should().ContainSingle(x => x.Nome == "Bia");
    }

    [Fact]
    public async Task GetPalestranteByIdAsync_With_And_Without_Redes()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var user = await DataContextFactory.SeedUserAsync(ctx, "carlos");
        var p = new Palestrante
        {
            Nome = "Carlos",
            UserId = user.Id,
            RedeSociais = new List<RedeSocial> { new() { Nome = "YT", URL = "https://yt" } }
        };
        ctx.Palestrantes.Add(p);
        await ctx.SaveChangesAsync();

        (await repo.GetPalestranteByIdAsync(p.Id, true))!.Nome.Should().Be("Carlos");
        (await repo.GetPalestranteByIdAsync(p.Id, false))!.Nome.Should().Be("Carlos");
    }

    [Fact]
    public async Task GetAllPalestrantesByNameAsync_With_And_Without_Eventos()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var evento = new Evento { Tema = "X", Telefone = "11", Email = "a@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        var user = await DataContextFactory.SeedUserAsync(ctx, "maria");
        var palestrante = new Palestrante { Nome = "Maria Silva", UserId = user.Id };
        ctx.Eventos.Add(evento);
        ctx.Palestrantes.Add(palestrante);
        await ctx.SaveChangesAsync();
        ctx.PalestranteEvento.Add(new Palestrante_Evento { EventoId = evento.Id, PalestranteId = palestrante.Id });
        await ctx.SaveChangesAsync();

        var withEventos = await repo.GetAllPalestrantesByNameAsync("maria", true);
        withEventos.Should().ContainSingle(p => p.Nome == "Maria Silva");
        withEventos[0].PalestrantesEventos.Should().ContainSingle(pe => pe.Evento.Tema == "X");

        var withoutEventos = await repo.GetAllPalestrantesByNameAsync("silva", false);
        withoutEventos.Should().ContainSingle(p => p.Nome == "Maria Silva");
    }

    [Fact]
    public async Task GetByTema_And_Associate_Disassociate()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var evento = new Evento
        {
            Tema = "Angular Summit",
            Local = "SP",
            Telefone = "11",
            Email = "a@b.com",
            QtdPessoas = 1,
            ImagemURL = "i.jpg"
        };
        var palestrante = new Palestrante { Nome = "Speaker", UserId = (await DataContextFactory.SeedUserAsync(ctx, "speaker")).Id };
        ctx.Eventos.Add(evento);
        ctx.Palestrantes.Add(palestrante);
        await ctx.SaveChangesAsync();

        (await repo.AssociateAsync(evento.Id, palestrante.Id)).Should().BeTrue();
        (await repo.AssociateAsync(evento.Id, palestrante.Id)).Should().BeTrue();
        (await repo.AssociateAsync(999, palestrante.Id)).Should().BeFalse();

        var byTema = await repo.GetAllPalestrantesByTemaAsync("Angular");
        byTema.Should().ContainSingle(p => p.Nome == "Speaker");

        (await repo.DisassociateAsync(evento.Id, palestrante.Id)).Should().BeTrue();
        (await repo.DisassociateAsync(evento.Id, palestrante.Id)).Should().BeFalse();
    }
}
