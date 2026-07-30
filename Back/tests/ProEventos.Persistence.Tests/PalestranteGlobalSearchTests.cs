using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class PalestranteGlobalSearchTests
{
    [Fact]
    public async Task GetPaged_Matches_MiniCurriculo()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var u1 = await DataContextFactory.SeedUserAsync(ctx, "p1");
        var u2 = await DataContextFactory.SeedUserAsync(ctx, "p2");
        ctx.Palestrantes.AddRange(
            new Palestrante { Nome = "Alice", MiniCurriculo = "Expert in UniqueCurriculoXYZ", UserId = u1.Id, Email = "a@b.com", Telefone = "1" },
            new Palestrante { Nome = "Bob", MiniCurriculo = "Other bio", UserId = u2.Id, Email = "b@b.com", Telefone = "2" });
        await ctx.SaveChangesAsync();

        var result = await repo.GetPagedPalestrantesAsync(1, 10, "uniquecurriculoxyz", true);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Nome.Should().Be("Alice");
    }

    [Fact]
    public async Task GetPaged_Matches_Linked_Evento_Tema()
    {
        var ctx = DataContextFactory.Create();
        var repo = new PalestrantesRepository(ctx);
        var user = await DataContextFactory.SeedUserAsync(ctx, "p3");
        var evento = new Evento
        {
            Tema = "UniqueLinkedTemaZZZ",
            Telefone = "11",
            Email = "e@b.com",
            QtdPessoas = 1,
            ImagemURL = "i.jpg"
        };
        var p = new Palestrante { Nome = "Carol", MiniCurriculo = "bio", UserId = user.Id, Email = "c@b.com", Telefone = "3" };
        ctx.Eventos.Add(evento);
        ctx.Palestrantes.Add(p);
        await ctx.SaveChangesAsync();
        ctx.PalestranteEvento.Add(new Palestrante_Evento { EventoId = evento.Id, PalestranteId = p.Id });
        await ctx.SaveChangesAsync();

        var result = await repo.GetPagedPalestrantesAsync(1, 10, "uniquelinkedtemazzz", true);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Nome.Should().Be("Carol");
    }
}
