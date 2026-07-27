using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Seeds;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class DataContextModelTests
{
    [Fact]
    public async Task OnModelCreating_Configures_Composite_Key_And_Cascades()
    {
        var ctx = DataContextFactory.Create();
        var user = await DataContextFactory.SeedUserAsync(ctx, "ana");
        var evento = new Evento
        {
            Tema = "Conf",
            Telefone = "11",
            Email = "a@b.com",
            QtdPessoas = 10,
            ImagemURL = "img.jpg",
            RedeSociais = new List<RedeSocial> { new() { Nome = "IG", URL = "https://ig" } }
        };
        var palestrante = new Palestrante
        {
            Nome = "Ana",
            UserId = user.Id,
            RedeSociais = new List<RedeSocial> { new() { Nome = "LI", URL = "https://li" } }
        };

        ctx.Eventos.Add(evento);
        ctx.Palestrantes.Add(palestrante);
        await ctx.SaveChangesAsync();

        ctx.PalestranteEvento.Add(new Palestrante_Evento { EventoId = evento.Id, PalestranteId = palestrante.Id });
        await ctx.SaveChangesAsync();

        var peKey = ctx.Model.FindEntityType(typeof(Palestrante_Evento))!.FindPrimaryKey()!;
        peKey.Properties.Select(p => p.Name).Should().BeEquivalentTo(new[] { "EventoId", "PalestranteId" });

        ctx.Eventos.Remove(evento);
        await ctx.SaveChangesAsync();
        (await ctx.RedeSociais.CountAsync()).Should().Be(1);

        ctx.Palestrantes.Remove(palestrante);
        await ctx.SaveChangesAsync();
        (await ctx.RedeSociais.CountAsync()).Should().Be(0);
    }

    [Fact]
    public void OnModelCreating_Configures_Unique_UserId_Index_On_Palestrante()
    {
        var ctx = DataContextFactory.Create();
        var entityType = ctx.Model.FindEntityType(typeof(Palestrante))!;
        var userIdIndex = entityType.GetIndexes().Single(i =>
            i.Properties.Count == 1 && i.Properties[0].Name == "UserId");

        userIdIndex.IsUnique.Should().BeTrue();
    }

    [Fact]
    public void EventoSeeds_Populates_Database()
    {
        var ctx = DataContextFactory.Create();
        EventoSeeds.Eventos(ctx);

        ctx.Eventos.Should().NotBeEmpty();
        ctx.Lotes.Should().NotBeEmpty();
    }

    [Fact]
    public void BaseEntity_CreateAt_Defaults_To_UtcNow_When_Null()
    {
        var entity = new Evento { CreateAt = null };
        entity.CreateAt.Should().NotBeNull();
        entity.CreateAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }
}
