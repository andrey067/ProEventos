using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class LostesRepostoryTests
{
    [Fact]
    public async Task GetLotesByEventoIdAsync_And_GetLoteByIdsAsync()
    {
        var ctx = DataContextFactory.Create();
        var repo = new LostesRepostory(ctx);
        var evento = new Evento { Tema = "E", Telefone = "11", Email = "a@b.com", QtdPessoas = 1, ImagemURL = "i.jpg" };
        ctx.Eventos.Add(evento);
        await ctx.SaveChangesAsync();

        var lote = new Lote
        {
            Nome = "Early",
            Preco = 50,
            Quantidade = 5,
            EventoId = evento.Id,
            DataIncio = DateTime.UtcNow,
            DataFim = DateTime.UtcNow.AddDays(1)
        };
        await repo.InsertAsync(lote);

        var list = await repo.GetLotesByEventoIdAsync(evento.Id);
        list.Should().ContainSingle(l => l.Nome == "Early");

        var single = await repo.GetLoteByIdsAsync(evento.Id, lote.Id);
        single!.Nome.Should().Be("Early");

        (await repo.GetLoteByIdsAsync(evento.Id, 9999)).Should().BeNull();
    }
}
