using ErrorOr;
using FluentAssertions;
using Moq;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces;
using ProEventos.Services.Dtos;
using ProEventos.Services.Mappings;
using ProEventos.Services.Services;
using Xunit;

namespace ProEventos.Services.Tests;

public class RedeSocialServiceTests
{
    private readonly Mock<IRepository<RedeSocial>> _repo = new();
    private readonly RedeSocialService _sut;

    public RedeSocialServiceTests()
    {
        MapsterConfig.Register();
        _sut = new RedeSocialService(_repo.Object);
    }

    [Fact]
    public async Task GetByEventoIdAsync_Filters_Owner()
    {
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 1, EventoId = 5, Nome = "IG", URL = "https://ig" },
            new() { Id = 2, EventoId = 9, Nome = "YT", URL = "https://yt" }
        });

        var result = await _sut.GetByEventoIdAsync(5);

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(r => r.Id == 1);
    }

    [Fact]
    public async Task GetByPalestranteIdAsync_Filters_Owner()
    {
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 1, PalestranteId = 3, Nome = "IG", URL = "https://ig" }
        });

        var result = await _sut.GetByPalestranteIdAsync(3);

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle();
    }

    [Fact]
    public async Task DeleteByEventoIdAsync_Rejects_Wrong_Owner()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new RedeSocial { Id = 1, EventoId = 99 });

        var ok = await _sut.DeleteByEventoIdAsync(5, 1);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.NotFound);
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SaveByEventoIdAsync_Inserts_And_Updates()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<RedeSocial>())).ReturnsAsync((RedeSocial r) => { r.Id = 10; return r; });
        _repo.Setup(r => r.SelectAsync(5)).ReturnsAsync(new RedeSocial { Id = 5, EventoId = 2, Nome = "Old", URL = "https://old" });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<RedeSocial>())).ReturnsAsync((RedeSocial r) => r);
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 10, EventoId = 2, Nome = "New", URL = "https://new" },
            new() { Id = 5, EventoId = 2, Nome = "Updated", URL = "https://up" }
        });

        var result = await _sut.SaveByEventoIdAsync(2, new List<RedeSocialDto>
        {
            new() { Id = 0, Nome = "New", URL = "https://new" },
            new() { Id = 5, Nome = "Updated", URL = "https://up" }
        });

        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(2);
        _repo.Verify(r => r.InsertAsync(It.IsAny<RedeSocial>()), Times.Once);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RedeSocial>()), Times.Once);
    }

    [Fact]
    public async Task DeleteByEventoIdAsync_Deletes_When_Owner_Matches()
    {
        _repo.Setup(r => r.SelectAsync(7)).ReturnsAsync(new RedeSocial { Id = 7, EventoId = 3 });
        _repo.Setup(r => r.DeleteAsync(7)).ReturnsAsync(true);

        var ok = await _sut.DeleteByEventoIdAsync(3, 7);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task SaveByPalestranteIdAsync_Inserts_And_Updates()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<RedeSocial>())).ReturnsAsync((RedeSocial r) => { r.Id = 20; return r; });
        _repo.Setup(r => r.SelectAsync(8)).ReturnsAsync(new RedeSocial { Id = 8, PalestranteId = 4, Nome = "Old", URL = "https://old" });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<RedeSocial>())).ReturnsAsync((RedeSocial r) => r);
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 20, PalestranteId = 4, Nome = "New", URL = "https://new" },
            new() { Id = 8, PalestranteId = 4, Nome = "Updated", URL = "https://up" }
        });

        var result = await _sut.SaveByPalestranteIdAsync(4, new List<RedeSocialDto>
        {
            new() { Id = 0, Nome = "New", URL = "https://new" },
            new() { Id = 8, Nome = "Updated", URL = "https://up" }
        });

        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(2);
    }

    [Fact]
    public async Task DeleteByPalestranteIdAsync_Handles_Missing_And_Wrong_Owner()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync((RedeSocial)null);
        (await _sut.DeleteByPalestranteIdAsync(1, 1)).IsError.Should().BeTrue();

        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new RedeSocial { Id = 2, PalestranteId = 99 });
        (await _sut.DeleteByPalestranteIdAsync(1, 2)).IsError.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteByPalestranteIdAsync_Deletes_When_Owner_Matches()
    {
        _repo.Setup(r => r.SelectAsync(3)).ReturnsAsync(new RedeSocial { Id = 3, PalestranteId = 6 });
        _repo.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);

        (await _sut.DeleteByPalestranteIdAsync(6, 3)).IsError.Should().BeFalse();
    }
}
