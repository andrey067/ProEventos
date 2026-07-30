using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
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

public class PalestranteServiceTests
{
    private const string OwnerUserId = "user-1";

    private readonly Mock<IRepository<Palestrante>> _repo = new();
    private readonly Mock<IPalestrantesRepository> _palestrantes = new();
    private readonly Mock<IEventoRepository> _eventos = new();
    private readonly Mock<UserManager<User>> _userManager;
    private readonly PalestranteService _sut;

    public PalestranteServiceTests()
    {
        MapsterConfig.Register();
        var store = new Mock<IUserStore<User>>();
        _userManager = new Mock<UserManager<User>>(
            store.Object, null, null, null, null, null, null, null, null);
        _userManager.Setup(m => m.FindByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((string id) => new User { Id = id, UserName = "u" });
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync(It.IsAny<string>()))
            .ReturnsAsync((Palestrante)null);
        _eventos.Setup(e => e.GetAllEventosByIdAsync(It.IsAny<int>(), false))
            .ReturnsAsync((int id, bool _) => new Evento { Id = id, UserId = OwnerUserId });
        _sut = new PalestranteService(_repo.Object, _palestrantes.Object, _eventos.Object, _userManager.Object);
    }

    private static PalestranteDto Dto(string nome, string userId = OwnerUserId) =>
        new() { Nome = nome, UserId = userId };

    [Fact]
    public async Task AddAsync_Inserts_And_Returns()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Palestrante>()))
            .ReturnsAsync((Palestrante p) => { p.Id = 3; return p; });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(3, true))
            .ReturnsAsync(new Palestrante { Id = 3, Nome = "Ana", UserId = OwnerUserId });

        var result = await _sut.AddAsync(Dto("Ana"));

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("Ana");
        _repo.Verify(r => r.InsertAsync(It.IsAny<Palestrante>()), Times.Once);
    }

    [Fact]
    public async Task GetAllAsync_Maps_List()
    {
        _palestrantes.Setup(r => r.GetAllPalestrantesAsync(true))
            .ReturnsAsync(new List<Palestrante> { new() { Id = 1, Nome = "Bia" } });

        var result = await _sut.GetAllAsync();

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(p => p.Nome == "Bia");
    }

    [Fact]
    public async Task GetPagedAsync_Returns_Envelope()
    {
        _palestrantes.Setup(r => r.GetPagedPalestrantesAsync(1, 10, null, true))
            .ReturnsAsync((new List<Palestrante> { new() { Id = 1, Nome = "Bia" } }, 1));

        var result = await _sut.GetPagedAsync(1, 10);

        result.IsError.Should().BeFalse();
        result.Value.Items.Should().ContainSingle(p => p.Nome == "Bia");
        result.Value.TotalCount.Should().Be(1);
        result.Value.Page.Should().Be(1);
        result.Value.PageSize.Should().Be(10);
    }

    [Fact]
    public async Task GetByIdAsync_Returns_Mapped_Dto()
    {
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(4, true))
            .ReturnsAsync(new Palestrante { Id = 4, Nome = "Carlos" });

        var result = await _sut.GetByIdAsync(4);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("Carlos");
    }

    [Fact]
    public async Task GetByUserIdAsync_Returns_Mapped_Dto()
    {
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 4, Nome = "Carlos", UserId = OwnerUserId });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(4, true))
            .ReturnsAsync(new Palestrante { Id = 4, Nome = "Carlos", UserId = OwnerUserId });

        var result = await _sut.GetByUserIdAsync(OwnerUserId);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("Carlos");
    }

    [Fact]
    public async Task GetByUserIdAsync_Returns_Unauthorized_When_Blank()
    {
        var result = await _sut.GetByUserIdAsync(" ");

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Unauthorized);
        result.FirstError.Code.Should().Be("Palestrante.Me.Unauthorized");
    }

    [Fact]
    public async Task GetByUserIdAsync_Returns_NotFound_When_No_Profile()
    {
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync((Palestrante)null);

        var result = await _sut.GetByUserIdAsync(OwnerUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Palestrante.Me.NotFound");
    }

    [Fact]
    public async Task UpdateAsync_Updates_And_Returns()
    {
        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new Palestrante { Id = 2, Nome = "Old", UserId = OwnerUserId });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Palestrante>())).ReturnsAsync(new Palestrante { Id = 2, Nome = "New" });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(2, true))
            .ReturnsAsync(new Palestrante { Id = 2, Nome = "New", UserId = OwnerUserId });

        var result = await _sut.UpdateAsync(2, Dto("New"), OwnerUserId, isOrganizer: false);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("New");
    }

    [Fact]
    public async Task UpdateAsync_Allows_Organizer_For_Any_Profile()
    {
        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new Palestrante { Id = 2, Nome = "Old", UserId = OwnerUserId });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Palestrante>())).ReturnsAsync(new Palestrante { Id = 2, Nome = "New" });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(2, true))
            .ReturnsAsync(new Palestrante { Id = 2, Nome = "New", UserId = OwnerUserId });

        var result = await _sut.UpdateAsync(2, Dto("New", "user-2"), "other-user", isOrganizer: true);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("New");
    }

    [Fact]
    public async Task UpdateAsync_Returns_Forbidden_When_Not_Organizer_And_Wrong_User()
    {
        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new Palestrante { Id = 2, Nome = "Old", UserId = OwnerUserId });

        var result = await _sut.UpdateAsync(2, Dto("New"), "other-user", isOrganizer: false);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Forbidden);
        result.FirstError.Code.Should().Be("Palestrante.Write.Forbidden");
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Palestrante>()), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_Preserves_UserId_When_Blank()
    {
        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new Palestrante { Id = 2, Nome = "Old", UserId = OwnerUserId });
        Palestrante updated = null;
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Palestrante>()))
            .Callback<Palestrante>(p => updated = p)
            .ReturnsAsync((Palestrante p) => p);
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(2, true))
            .ReturnsAsync(new Palestrante { Id = 2, Nome = "New", UserId = OwnerUserId });

        var result = await _sut.UpdateAsync(2, new PalestranteDto { Nome = "New", UserId = null }, OwnerUserId, isOrganizer: false);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("New");
        updated.Should().NotBeNull();
        updated!.UserId.Should().Be(OwnerUserId);
    }

    [Fact]
    public async Task UpdateAsync_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.SelectAsync(404)).ReturnsAsync((Palestrante)null);

        var result = await _sut.UpdateAsync(404, Dto("X"), OwnerUserId, isOrganizer: false);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_Succeeds_When_Found()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });
        _repo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var ok = await _sut.DeleteAsync(1, OwnerUserId, isOrganizer: false);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_Allows_Organizer_For_Any_Profile()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });
        _repo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var ok = await _sut.DeleteAsync(1, "other-user", isOrganizer: true);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_Returns_Forbidden_When_Not_Organizer_And_Wrong_User()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });

        var ok = await _sut.DeleteAsync(1, "other-user", isOrganizer: false);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.Forbidden);
        ok.FirstError.Code.Should().Be("Palestrante.Write.Forbidden");
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.SelectAsync(99)).ReturnsAsync((Palestrante)null);

        var ok = await _sut.DeleteAsync(99, OwnerUserId, isOrganizer: false);

        ok.IsError.Should().BeTrue();
        ok.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task GetByNome_And_Tema_And_Associate()
    {
        _palestrantes.Setup(r => r.GetAllPalestrantesByNameAsync("Ada", true))
            .ReturnsAsync(new[] { new Palestrante { Id = 1, Nome = "Ada" } });
        _palestrantes.Setup(r => r.GetAllPalestrantesByTemaAsync("Angular"))
            .ReturnsAsync(new List<Palestrante> { new() { Id = 1, Nome = "Ada" } });
        _palestrantes.Setup(r => r.AssociateAsync(2, 1)).ReturnsAsync(true);
        _palestrantes.Setup(r => r.DisassociateAsync(2, 1)).ReturnsAsync(true);

        (await _sut.GetByNomeAsync("Ada")).Value.Should().ContainSingle(p => p.Nome == "Ada");
        (await _sut.GetByTemaAsync("Angular")).Value.Should().ContainSingle(p => p.Nome == "Ada");
        (await _sut.AssociateAsync(2, 1, OwnerUserId)).IsError.Should().BeFalse();
        (await _sut.DisassociateAsync(2, 1, OwnerUserId)).IsError.Should().BeFalse();
    }

    [Fact]
    public async Task GetByIdAsync_Returns_NotFound_When_Missing()
    {
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(9, true)).ReturnsAsync((Palestrante)null);

        var result = await _sut.GetByIdAsync(9);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task Associate_And_Disassociate_Return_NotFound_When_False()
    {
        _palestrantes.Setup(r => r.AssociateAsync(1, 2)).ReturnsAsync(false);
        _palestrantes.Setup(r => r.DisassociateAsync(1, 2)).ReturnsAsync(false);

        (await _sut.AssociateAsync(1, 2, OwnerUserId)).IsError.Should().BeTrue();
        (await _sut.DisassociateAsync(1, 2, OwnerUserId)).IsError.Should().BeTrue();
    }

    [Fact]
    public async Task Associate_And_Disassociate_Deny_Non_Owner()
    {
        var denied = await _sut.AssociateAsync(2, 1, "other-user");
        denied.IsError.Should().BeTrue();
        denied.FirstError.Code.Should().Be("Palestrante.Associate.Forbidden");

        var deniedDis = await _sut.DisassociateAsync(2, 1, "other-user");
        deniedDis.IsError.Should().BeTrue();
        deniedDis.FirstError.Code.Should().Be("Palestrante.Disassociate.Forbidden");

        _palestrantes.Verify(r => r.AssociateAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _palestrantes.Verify(r => r.DisassociateAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task Associate_Returns_NotFound_When_Evento_Missing()
    {
        _eventos.Setup(e => e.GetAllEventosByIdAsync(404, false)).ReturnsAsync((Evento)null);

        var result = await _sut.AssociateAsync(404, 1, OwnerUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Palestrante.Associate.EventoNotFound");
    }

    [Fact]
    public async Task Disassociate_Returns_NotFound_When_Evento_Missing()
    {
        _eventos.Setup(e => e.GetAllEventosByIdAsync(404, false)).ReturnsAsync((Evento)null);

        var result = await _sut.DisassociateAsync(404, 1, OwnerUserId);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Palestrante.Disassociate.EventoNotFound");
    }

    [Fact]
    public async Task GetPagedAsync_Requeries_When_Page_Beyond_Last()
    {
        _palestrantes.SetupSequence(r => r.GetPagedPalestrantesAsync(It.IsAny<int>(), 10, null, true))
            .ReturnsAsync((new List<Palestrante>(), 12))
            .ReturnsAsync((new List<Palestrante> { new() { Id = 12, Nome = "Zed" } }, 12));

        var result = await _sut.GetPagedAsync(50, 10);

        result.Value.Page.Should().Be(2);
        result.Value.Items.Should().ContainSingle(p => p.Nome == "Zed");
    }

    [Fact]
    public async Task AddAsync_Rejects_Missing_UserId()
    {
        var result = await _sut.AddAsync(new PalestranteDto { Nome = "X", UserId = " " });

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Palestrante.UserId.Required");
    }

    [Fact]
    public async Task AddAsync_Rejects_Unknown_User()
    {
        _userManager.Setup(m => m.FindByIdAsync("missing")).ReturnsAsync((User)null);

        var result = await _sut.AddAsync(Dto("X", "missing"));

        result.FirstError.Code.Should().Be("Palestrante.UserId.NotFound");
    }

    [Fact]
    public async Task AddAsync_Rejects_Already_Linked_User()
    {
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync(OwnerUserId))
            .ReturnsAsync(new Palestrante { Id = 9, UserId = OwnerUserId });

        var result = await _sut.AddAsync(Dto("X"));

        result.FirstError.Code.Should().Be("Palestrante.Add.UserAlreadyLinked");
    }

    [Fact]
    public async Task UpdateAsync_Rejects_Null_Body()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });

        var result = await _sut.UpdateAsync(1, null, OwnerUserId, isOrganizer: false);

        result.FirstError.Code.Should().Be("Palestrante.Update.BodyRequired");
    }

    [Fact]
    public async Task UpdateAsync_Rejects_User_Already_Linked()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("user-2"))
            .ReturnsAsync(new Palestrante { Id = 2, UserId = "user-2" });

        var result = await _sut.UpdateAsync(1, Dto("A", "user-2"), OwnerUserId, isOrganizer: false);

        result.FirstError.Code.Should().Be("Palestrante.Update.UserAlreadyLinked");
    }

    [Fact]
    public async Task DeleteAsync_Maps_AppException()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A", UserId = OwnerUserId });
        _repo.Setup(r => r.DeleteAsync(1))
            .ThrowsAsync(new NotFoundException("BaseRepository.DeleteAsync", "Item não encontrado"));

        var result = await _sut.DeleteAsync(1, OwnerUserId, isOrganizer: false);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task AddAsync_Maps_AppException()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Palestrante>()))
            .ThrowsAsync(new ConflictException("BaseRepository.InsertAsync", "Item já cadastrado"));

        var result = await _sut.AddAsync(Dto("X"));

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }
}
