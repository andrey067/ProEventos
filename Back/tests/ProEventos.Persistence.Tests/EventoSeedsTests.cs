using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Persistence.Seeds;
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

    [Fact]
    public async Task AssignOwnerToOrphans_Sets_Admin_UserId_On_Blank_Owners()
    {
        var (ctx, userManager, _) = IdentityTestHelper.Create();
        using (ctx)
        {
            EventoSeeds.Eventos(ctx);
            await IdentitySeeds.EnsureAdminAsync(userManager);
            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);

            ctx.Eventos.Should().OnlyContain(e => e.UserId == null || e.UserId == "");

            await EventoSeeds.AssignOwnerToOrphans(ctx, userManager);

            ctx.Eventos.Should().OnlyContain(e => e.UserId == admin!.Id);

            await EventoSeeds.AssignOwnerToOrphans(ctx, userManager);
            ctx.Eventos.Should().OnlyContain(e => e.UserId == admin!.Id);
        }
    }

    [Fact]
    public async Task AssignOwnerToOrphans_Noops_When_Admin_Missing()
    {
        var (ctx, userManager, _) = IdentityTestHelper.Create();
        using (ctx)
        {
            ctx.Eventos.Add(new Evento
            {
                Tema = "Orphan",
                Telefone = "11",
                Email = "o@t.com",
                QtdPessoas = 1,
                ImagemURL = "a.jpg"
            });
            ctx.SaveChanges();

            await EventoSeeds.AssignOwnerToOrphans(ctx, userManager);

            ctx.Eventos.Single().UserId.Should().BeNull();
        }
    }
}
