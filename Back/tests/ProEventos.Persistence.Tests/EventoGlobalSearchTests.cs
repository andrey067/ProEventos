using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class EventoGlobalSearchTests
{
    private static async Task SeedAsync(DataContext ctx)
    {
        ctx.Eventos.AddRange(
            new Evento
            {
                Tema = "UniqueTemaAAA",
                Local = "OtherLocal",
                Email = "a@x.com",
                Telefone = "111",
                QtdPessoas = 10,
                ImagemURL = "img.jpg",
                Lotes = new List<Lote>
                {
                    new() { Nome = "L", Preco = 10, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
                }
            },
            new Evento
            {
                Tema = "OtherTema",
                Local = "UniqueLocalBBB",
                Email = "b@x.com",
                Telefone = "222",
                QtdPessoas = 10,
                ImagemURL = "img.jpg",
                Lotes = new List<Lote>
                {
                    new() { Nome = "L", Preco = 10, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
                }
            },
            new Evento
            {
                Tema = "OtherTema2",
                Local = "OtherLocal2",
                Email = "uniqueemailccc@x.com",
                Telefone = "333",
                QtdPessoas = 10,
                ImagemURL = "img.jpg",
                Lotes = new List<Lote>
                {
                    new() { Nome = "L", Preco = 10, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
                }
            },
            new Evento
            {
                Tema = "OtherTema3",
                Local = "OtherLocal3",
                Email = "c@x.com",
                Telefone = "UniquePhoneDDD",
                QtdPessoas = 10,
                ImagemURL = "img.jpg",
                Lotes = new List<Lote>
                {
                    new() { Nome = "L", Preco = 10, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
                }
            });
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task GetPaged_Matches_Local_Only()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "uniquelocalbbb", false);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Local.Should().Contain("UniqueLocalBBB");
    }

    [Fact]
    public async Task GetPaged_Matches_Email_Only()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "uniqueemailccc", false);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Email.Should().Contain("uniqueemailccc");
    }

    [Fact]
    public async Task GetPaged_Matches_Telefone_Only()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "uniquephoneddd", false);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Telefone.Should().Contain("UniquePhoneDDD");
    }

    [Fact]
    public async Task GetPaged_Matches_Tema_Only()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "uniquetemaaaa", false);

        result.TotalCount.Should().Be(1);
        result.Items.Single().Tema.Should().Contain("UniqueTemaAAA");
    }

    [Fact]
    public async Task GetPaged_Empty_Term_Returns_All()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "   ", false);

        result.TotalCount.Should().Be(4);
    }

    [Fact]
    public async Task GetPaged_Does_Not_Match_ImagemURL_Alone()
    {
        var ctx = DataContextFactory.Create();
        await SeedAsync(ctx);
        var repo = new EventoRepository(ctx);

        var result = await repo.GetPagedEventosAsync(1, 10, "img.jpg", false);

        result.TotalCount.Should().Be(0);
    }
}
