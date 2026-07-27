using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProEventos.CrossCutting.DependencyInjection;
using ProEventos.Persistence;
using Xunit;

namespace ProEventos.Api.Tests;

public class CrossCuttingTests
{
    [Fact]
    public void ConfigureRepository_AddSeeds_Is_NoOp()
    {
        var options = new DbContextOptionsBuilder<DataContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var ctx = new DataContext(options);
        var act = () => ConfigureRepository.AddSeeds(ctx);
        act.Should().NotThrow();
    }
}
