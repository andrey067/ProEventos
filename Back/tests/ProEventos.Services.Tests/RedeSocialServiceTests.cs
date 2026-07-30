using ErrorOr;
using FluentAssertions;
using Moq;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Mappings;
using ProEventos.Services.Services;
using Xunit;

namespace ProEventos.Services.Tests;

public class RedeSocialServiceTests
{
    private const string OwnerUserId = "owner-1";
    private const string OtherUserId = "other-user";

    private readonly Mock<IRepository<RedeSocial>> _repo = new();
    private readonly Mock<IEventoRepository> _eventoRepo = new();
    private readonly Mock<IPalestrantesRepository> _palestrantesRepo = new();
    private readonly RedeSocialService _sut;

    public RedeSocialServiceTests()
    {
        MapsterConfig.Register();
        _sut = new RedeSocialService(_repo.Object, _eventoRepo.Object, _palestrantesRepo.Object);
    }

    private void SetupEventoOwner(int eventoId, string userId = OwnerUserId)
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(eventoId, false))
            .ReturnsAsync(new Evento { Id = eventoId, UserId = userId, Tema = "T" });
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
        SetupEventoOwner(5);
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new RedeSocial { Id = 1, EventoId = 99 });

        var ok = await _sut.DeleteByEventoIdAsync(5, 1, OwnerUserId);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.NotFound);
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByEventoIdAsync_Returns_Forbidden_When_Evento_Owner_Mismatches()
    {
        SetupEventoOwner(5);

        var ok = await _sut.DeleteByEventoIdAsync(5, 1, OtherUserId);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.Forbidden);
        ok.FirstError.Code.Should().Be("RedeSocial.Evento.Forbidden");
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task SaveByEventoIdAsync_Inserts_And_Updates()
    {
        SetupEventoOwner(2);
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
        }, OwnerUserId);

        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(2);
        _repo.Verify(r => r.InsertAsync(It.IsAny<RedeSocial>()), Times.Once);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RedeSocial>()), Times.Once);
    }

    [Fact]
    public async Task SaveByEventoIdAsync_Returns_Forbidden_When_Evento_Owner_Mismatches()
    {
        SetupEventoOwner(2);

        var result = await _sut.SaveByEventoIdAsync(2, new List<RedeSocialDto>
        {
            new() { Id = 0, Nome = "New", URL = "https://new" }
        }, OtherUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Forbidden);
        result.FirstError.Code.Should().Be("RedeSocial.Evento.Forbidden");
        _repo.Verify(r => r.InsertAsync(It.IsAny<RedeSocial>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByEventoIdAsync_Deletes_When_Owner_Matches()
    {
        SetupEventoOwner(3);
        _repo.Setup(r => r.SelectAsync(7)).ReturnsAsync(new RedeSocial { Id = 7, EventoId = 3 });
        _repo.Setup(r => r.DeleteAsync(7)).ReturnsAsync(true);

        var ok = await _sut.DeleteByEventoIdAsync(3, 7, OwnerUserId);

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
    public async Task SaveByEventoIdAsync_Skips_Update_When_Owner_Mismatch()
    {
        SetupEventoOwner(2);
        _repo.Setup(r => r.SelectAsync(5)).ReturnsAsync(new RedeSocial { Id = 5, EventoId = 99, Nome = "Old", URL = "https://old" });
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>());

        var result = await _sut.SaveByEventoIdAsync(2, new List<RedeSocialDto>
        {
            new() { Id = 5, Nome = "Updated", URL = "https://up" }
        }, OwnerUserId);

        result.IsError.Should().BeFalse();
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RedeSocial>()), Times.Never);
    }

    [Fact]
    public async Task SaveByPalestranteIdAsync_Skips_Update_When_Owner_Mismatch()
    {
        _repo.Setup(r => r.SelectAsync(8)).ReturnsAsync(new RedeSocial { Id = 8, PalestranteId = 99, Nome = "Old", URL = "https://old" });
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>());

        var result = await _sut.SaveByPalestranteIdAsync(4, new List<RedeSocialDto>
        {
            new() { Id = 8, Nome = "Updated", URL = "https://up" }
        });

        result.IsError.Should().BeFalse();
        _repo.Verify(r => r.UpdateAsync(It.IsAny<RedeSocial>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByEventoIdAsync_Maps_AppException()
    {
        SetupEventoOwner(3);
        _repo.Setup(r => r.SelectAsync(7)).ReturnsAsync(new RedeSocial { Id = 7, EventoId = 3 });
        _repo.Setup(r => r.DeleteAsync(7))
            .ThrowsAsync(new NotFoundException("BaseRepository.DeleteAsync", "Item não encontrado"));

        var result = await _sut.DeleteByEventoIdAsync(3, 7, OwnerUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task DeleteByPalestranteIdAsync_Deletes_When_Owner_Matches()
    {
        _repo.Setup(r => r.SelectAsync(3)).ReturnsAsync(new RedeSocial { Id = 3, PalestranteId = 6 });
        _repo.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);

        (await _sut.DeleteByPalestranteIdAsync(6, 3)).IsError.Should().BeFalse();
    }

    [Fact]
    public async Task GetMineByUserIdAsync_Returns_Palestrante_Redes()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 4, UserId = OwnerUserId, Nome = "Ana" });
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 1, PalestranteId = 4, Nome = "IG", URL = "https://ig" },
            new() { Id = 2, PalestranteId = 99, Nome = "YT", URL = "https://yt" }
        });

        var result = await _sut.GetMineByUserIdAsync(OwnerUserId);

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(r => r.Id == 1);
    }

    [Fact]
    public async Task GetMineByUserIdAsync_Returns_Forbidden_When_No_Profile()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync((Palestrante)null);

        var result = await _sut.GetMineByUserIdAsync(OwnerUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Forbidden);
        result.FirstError.Code.Should().Be("RedeSocial.Palestrante.NoProfile");
    }

    [Fact]
    public async Task SaveMineByUserIdAsync_Saves_Via_Linked_Palestrante()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 4, UserId = OwnerUserId, Nome = "Ana" });
        _repo.Setup(r => r.InsertAsync(It.IsAny<RedeSocial>())).ReturnsAsync((RedeSocial r) => { r.Id = 10; return r; });
        _repo.Setup(r => r.SelectAsyncAll()).ReturnsAsync(new List<RedeSocial>
        {
            new() { Id = 10, PalestranteId = 4, Nome = "New", URL = "https://new" }
        });

        var result = await _sut.SaveMineByUserIdAsync(OwnerUserId, new List<RedeSocialDto>
        {
            new() { Id = 0, Nome = "New", URL = "https://new" }
        });

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(r => r.Nome == "New");
        _repo.Verify(r => r.InsertAsync(It.Is<RedeSocial>(r => r.PalestranteId == 4)), Times.Once);
    }

    [Fact]
    public async Task DeleteMineByUserIdAsync_Deletes_Via_Linked_Palestrante()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 6, UserId = OwnerUserId, Nome = "Ana" });
        _repo.Setup(r => r.SelectAsync(3)).ReturnsAsync(new RedeSocial { Id = 3, PalestranteId = 6 });
        _repo.Setup(r => r.DeleteAsync(3)).ReturnsAsync(true);

        var ok = await _sut.DeleteMineByUserIdAsync(OwnerUserId, 3);

        ok.IsError.Should().BeFalse();
        _repo.Verify(r => r.DeleteAsync(3), Times.Once);
    }

    [Fact]
    public async Task EnsureCanMutatePalestranteRedesAsync_Allows_Organizer()
    {
        var ok = await _sut.EnsureCanMutatePalestranteRedesAsync(99, OtherUserId, isOrganizer: true);

        ok.IsError.Should().BeFalse();
        _palestrantesRepo.Verify(r => r.GetPalestranteByUserIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task EnsureCanMutatePalestranteRedesAsync_Allows_Speaker_Own_Profile()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 4, UserId = OwnerUserId });

        var ok = await _sut.EnsureCanMutatePalestranteRedesAsync(4, OwnerUserId, isOrganizer: false);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task EnsureCanMutatePalestranteRedesAsync_Forbids_Speaker_Other_Profile()
    {
        _palestrantesRepo.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 4, UserId = OwnerUserId });

        var ok = await _sut.EnsureCanMutatePalestranteRedesAsync(99, OwnerUserId, isOrganizer: false);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.Forbidden);
        ok.FirstError.Code.Should().Be("RedeSocial.Palestrante.Forbidden");
    }
}
