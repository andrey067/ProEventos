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

    [Fact]
    public async Task GetPagedPalestrantesAsync_Paginates_And_Filters()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var evento = new Evento { Tema = "React Summit", Telefone = "11", Email = "a@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        ctx.Eventos.Add(evento);
        for (var i = 1; i <= 4; i++)
        {
            var user = await DataContextFactory.SeedUserAsync(ctx, $"user{i}");
            var p = new Palestrante
            {
                Nome = i % 2 == 0 ? $"Maria {i}" : $"Joao {i}",
                UserId = user.Id,
                RedeSociais = new List<RedeSocial> { new() { Nome = "LI", URL = "https://li" } }
            };
            ctx.Palestrantes.Add(p);
            await ctx.SaveChangesAsync();
            ctx.PalestranteEvento.Add(new Palestrante_Evento { EventoId = evento.Id, PalestranteId = p.Id });
            await ctx.SaveChangesAsync();
        }

        var byNome = await repo.GetPagedPalestrantesAsync(1, 10, " maria ", true);
        byNome.TotalCount.Should().Be(2);
        byNome.Items.Should().OnlyContain(p => p.Nome.Contains("Maria"));

        var byTema = await repo.GetPagedPalestrantesAsync(1, 10, "react", true);
        byTema.TotalCount.Should().Be(4);

        var withoutRedes = await repo.GetPagedPalestrantesAsync(1, 2, null, false);
        withoutRedes.Items.Should().HaveCount(2);
        withoutRedes.TotalCount.Should().Be(4);

        var page2 = await repo.GetPagedPalestrantesAsync(2, 2, null, false);
        page2.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetPalestranteByUserIdAsync_Handles_Empty_And_Valid()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var user = await DataContextFactory.SeedUserAsync(ctx, "uid-test");
        var p = new Palestrante { Nome = "UID", UserId = user.Id };
        ctx.Palestrantes.Add(p);
        await ctx.SaveChangesAsync();

        (await repo.GetPalestranteByUserIdAsync(null)).Should().BeNull();
        (await repo.GetPalestranteByUserIdAsync("   ")).Should().BeNull();
        (await repo.GetPalestranteByUserIdAsync("missing")).Should().BeNull();
        (await repo.GetPalestranteByUserIdAsync(user.Id))!.Nome.Should().Be("UID");
    }

    [Fact]
    public async Task CountEventosByPalestranteIdAsync_Returns_Link_Count()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var evento1 = new Evento { Tema = "A", Telefone = "11", Email = "a@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        var evento2 = new Evento { Tema = "B", Telefone = "11", Email = "b@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        var palestrante = new Palestrante { Nome = "P", UserId = (await DataContextFactory.SeedUserAsync(ctx, "p")).Id };
        ctx.Eventos.AddRange(evento1, evento2);
        ctx.Palestrantes.Add(palestrante);
        await ctx.SaveChangesAsync();
        ctx.PalestranteEvento.AddRange(
            new Palestrante_Evento { EventoId = evento1.Id, PalestranteId = palestrante.Id },
            new Palestrante_Evento { EventoId = evento2.Id, PalestranteId = palestrante.Id });
        await ctx.SaveChangesAsync();

        (await repo.CountEventosByPalestranteIdAsync(palestrante.Id)).Should().Be(2);
        (await repo.CountEventosByPalestranteIdAsync(999)).Should().Be(0);
    }

    [Fact]
    public async Task AssociateAsync_Returns_False_When_Palestrante_Missing()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var evento = new Evento { Tema = "X", Telefone = "11", Email = "a@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        ctx.Eventos.Add(evento);
        await ctx.SaveChangesAsync();

        (await repo.AssociateAsync(evento.Id, 404)).Should().BeFalse();
    }

    [Fact]
    public async Task GetPalestranteByIdAsync_Returns_Null_When_Not_Found()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        (await repo.GetPalestranteByIdAsync(999, true)).Should().BeNull();
    }
}
