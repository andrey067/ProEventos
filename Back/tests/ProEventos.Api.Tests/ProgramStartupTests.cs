using FluentAssertions;
using Xunit;

namespace ProEventos.Api.Tests;

public class ProgramStartupTests
{
    [Fact]
    public async Task Factory_Skips_Seed_When_Eventos_Already_Exist()
    {
        const string sharedDb = "ProEventosSharedSeedTest";
        await using var factory1 = new CustomWebApplicationFactory(sharedDb);
        (await factory1.CreateClient().GetAsync("/eventos")).EnsureSuccessStatusCode();

        await using var factory2 = new CustomWebApplicationFactory(sharedDb);
        (await factory2.CreateClient().GetAsync("/eventos")).StatusCode
            .Should().Be(System.Net.HttpStatusCode.OK);
    }
}
