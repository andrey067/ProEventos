using FluentAssertions;
using ProEventos.Persistence.Seeds;
using ProEventos.Persistence.Tests;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class EventoSeedsTests
{
    [Fact]
    public void Eventos_Seeds_AtLeast50_WithHttpsImagemUrl()
    {
        using var context = DataContextFactory.Create();

        EventoSeeds.Eventos(context);

        context.Eventos.Count().Should().BeGreaterThan(30);
        context.Eventos.Count().Should().BeGreaterThanOrEqualTo(EventoSeeds.MinEventoCount);

        var withHttps = context.Eventos.Count(e =>
            e.ImagemURL != null && e.ImagemURL.StartsWith("https://", StringComparison.OrdinalIgnoreCase));
        withHttps.Should().Be(context.Eventos.Count());

        context.Lotes.Should().NotBeEmpty();
        context.Lotes.Should().OnlyContain(l => l.DataFim >= l.DataIncio && l.Preco > 0 && l.Quantidade > 0);
    }
}
