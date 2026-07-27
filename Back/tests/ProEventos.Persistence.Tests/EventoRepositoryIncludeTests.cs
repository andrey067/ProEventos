using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class EventoRepositoryIncludeTests
{
    [Fact]
    public async Task GetAllEventosByIdAsync_With_Palestrante_Flag_On_Plain_Insert()
    {
        var ctx = DataContextFactory.Create();
        var repo = new EventoRepository(ctx);
        var evento = new Evento
        {
            Tema = "Plain",
            Telefone = "11",
            Email = "a@b.com",
            QtdPessoas = 1,
            ImagemURL = "i.jpg"
        };
        await repo.InsertAsync(evento);

        var without = await repo.GetAllEventosByIdAsync(evento.Id, false);
        without.Should().NotBeNull();

        var withPalestrante = await repo.GetAllEventosByIdAsync(evento.Id, true);
        withPalestrante.Should().NotBeNull();
    }
}
