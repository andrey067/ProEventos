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

public class PalestranteServiceTests
{
    private readonly Mock<IRepository<Palestrante>> _repo = new();
    private readonly Mock<IPalestrantesRepository> _palestrantes = new();
    private readonly PalestranteService _sut;

    public PalestranteServiceTests()
    {
        MapsterConfig.Register();
        _sut = new PalestranteService(_repo.Object, _palestrantes.Object);
    }

    [Fact]
    public async Task AddAsync_Inserts_And_Returns()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Palestrante>()))
            .ReturnsAsync((Palestrante p) => { p.Id = 3; return p; });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(3, true))
            .ReturnsAsync(new Palestrante { Id = 3, Nome = "Ana" });

        var result = await _sut.AddAsync(new PalestranteDto { Nome = "Ana" });

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
    public async Task GetByIdAsync_Returns_Mapped_Dto()
    {
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(4, true))
            .ReturnsAsync(new Palestrante { Id = 4, Nome = "Carlos" });

        var result = await _sut.GetByIdAsync(4);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("Carlos");
    }

    [Fact]
    public async Task UpdateAsync_Updates_And_Returns()
    {
        _repo.Setup(r => r.SelectAsync(2)).ReturnsAsync(new Palestrante { Id = 2, Nome = "Old" });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Palestrante>())).ReturnsAsync(new Palestrante { Id = 2, Nome = "New" });
        _palestrantes.Setup(r => r.GetPalestranteByIdAsync(2, true))
            .ReturnsAsync(new Palestrante { Id = 2, Nome = "New" });

        var result = await _sut.UpdateAsync(2, new PalestranteDto { Nome = "New" });

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("New");
    }

    [Fact]
    public async Task UpdateAsync_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.SelectAsync(404)).ReturnsAsync((Palestrante)null);

        var result = await _sut.UpdateAsync(404, new PalestranteDto { Nome = "X" });

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task DeleteAsync_Succeeds_When_Found()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync(new Palestrante { Id = 1, Nome = "A" });
        _repo.Setup(r => r.DeleteAsync(1)).ReturnsAsync(true);

        var ok = await _sut.DeleteAsync(1);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.SelectAsync(99)).ReturnsAsync((Palestrante)null);

        var ok = await _sut.DeleteAsync(99);

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
        (await _sut.AssociateAsync(2, 1)).IsError.Should().BeFalse();
        (await _sut.DisassociateAsync(2, 1)).IsError.Should().BeFalse();
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

        (await _sut.AssociateAsync(1, 2)).IsError.Should().BeTrue();
        (await _sut.DisassociateAsync(1, 2)).IsError.Should().BeTrue();
    }

    [Fact]
    public async Task AddAsync_Maps_AppException()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Palestrante>()))
            .ThrowsAsync(new ConflictException("BaseRepository.InsertAsync", "Item já cadastrado"));

        var result = await _sut.AddAsync(new PalestranteDto { Nome = "X" });

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }
}
