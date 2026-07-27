using ErrorOr;
using FluentAssertions;
using Moq;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Mappings;
using ProEventos.Services.Services;
using Xunit;

namespace ProEventos.Services.Tests;

public class LotesServiceTests
{
    private readonly Mock<ILotesRepository> _repo = new();
    private readonly LotesServices _sut;

    public LotesServiceTests()
    {
        MapsterConfig.Register();
        _sut = new LotesServices(_repo.Object);
    }

    [Fact]
    public async Task GetLotesByEventoIdAsync_Returns_Mapped_List()
    {
        _repo.Setup(r => r.GetLotesByEventoIdAsync(1))
            .ReturnsAsync(new List<Lote> { new() { Id = 9, EventoId = 1, Nome = "VIP", Preco = 10 } });

        var result = await _sut.GetLotesByEventoIdAsync(1);

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(l => l.Nome == "VIP");
    }

    [Fact]
    public async Task DeleteLote_Calls_Repository()
    {
        _repo.Setup(r => r.GetLoteByIdsAsync(1, 2)).ReturnsAsync(new Lote { Id = 2, EventoId = 1 });
        _repo.Setup(r => r.DeleteAsync(2)).ReturnsAsync(true);

        var ok = await _sut.DeleteLote(1, 2);

        ok.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task AddLote_Inserts_With_EventoId()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Lote>()))
            .ReturnsAsync((Lote l) => l);

        var result = await _sut.AddLote(5, new LoteDto { Nome = "Early", Preco = 50, Quantidade = 10, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) });

        result.IsError.Should().BeFalse();
        _repo.Verify(r => r.InsertAsync(It.Is<Lote>(l => l.EventoId == 5 && l.Nome == "Early")), Times.Once);
    }

    [Fact]
    public async Task GetLoteByIdsAsync_Returns_Mapped_Dto()
    {
        _repo.Setup(r => r.GetLoteByIdsAsync(1, 3))
            .ReturnsAsync(new Lote { Id = 3, EventoId = 1, Nome = "Std", Preco = 20 });

        var result = await _sut.GetLoteByIdsAsync(1, 3);

        result.IsError.Should().BeFalse();
        result.Value.Nome.Should().Be("Std");
    }

    [Fact]
    public async Task GetLotesByEventoIdAsync_Returns_Empty_When_Null()
    {
        _repo.Setup(r => r.GetLotesByEventoIdAsync(7)).ReturnsAsync((List<Lote>)null);

        var result = await _sut.GetLotesByEventoIdAsync(7);

        result.IsError.Should().BeFalse();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task SaveLotes_Inserts_New_And_Updates_Existing()
    {
        var existing = new Lote { Id = 10, EventoId = 2, Nome = "Old", Preco = 1 };
        _repo.SetupSequence(r => r.GetLotesByEventoIdAsync(2))
            .ReturnsAsync(new List<Lote> { existing })
            .ReturnsAsync(new List<Lote>
            {
                existing,
                new Lote { Id = 11, EventoId = 2, Nome = "New", Preco = 5 }
            });
        _repo.Setup(r => r.InsertAsync(It.IsAny<Lote>())).ReturnsAsync((Lote l) => { l.Id = 11; return l; });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Lote>())).ReturnsAsync((Lote l) => l);

        var models = new List<LoteDto>
        {
            new() { Id = 0, Nome = "New", Preco = 5, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) },
            new() { Id = 10, Nome = "Updated", Preco = 2, Quantidade = 2, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
        };

        var result = await _sut.SaveLotes(2, models);

        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(2);
        _repo.Verify(r => r.InsertAsync(It.IsAny<Lote>()), Times.Once);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Lote>()), Times.Once);
    }

    [Fact]
    public async Task DeleteLote_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.GetLoteByIdsAsync(1, 99)).ReturnsAsync((Lote)null);

        var result = await _sut.DeleteLote(1, 99);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Lote.Delete.NotFound");
    }

    [Fact]
    public async Task SaveLotes_Rejects_Invalid_Price_Quantity_And_Dates()
    {
        var badPrice = await _sut.SaveLotes(1, new List<LoteDto>
        {
            new() { Nome = "A", Preco = 0, Quantidade = 1, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
        });
        badPrice.IsError.Should().BeTrue();
        badPrice.FirstError.Type.Should().Be(ErrorType.Validation);
        badPrice.FirstError.Description.Should().Contain("Preço");

        var badQty = await _sut.SaveLotes(1, new List<LoteDto>
        {
            new() { Nome = "A", Preco = 1, Quantidade = 0, DataIncio = DateTime.UtcNow, DataFim = DateTime.UtcNow.AddDays(1) }
        });
        badQty.IsError.Should().BeTrue();
        badQty.FirstError.Description.Should().Contain("Quantidade");

        var badDates = await _sut.SaveLotes(1, new List<LoteDto>
        {
            new() { Nome = "A", Preco = 1, Quantidade = 1, DataIncio = DateTime.UtcNow.AddDays(2), DataFim = DateTime.UtcNow }
        });
        badDates.IsError.Should().BeTrue();
        badDates.FirstError.Description.Should().Contain("Data");
    }

    [Fact]
    public async Task AddLote_Rejects_Empty_Name()
    {
        var result = await _sut.AddLote(1, new LoteDto
        {
            Nome = " ",
            Preco = 1,
            Quantidade = 1,
            DataIncio = DateTime.UtcNow,
            DataFim = DateTime.UtcNow.AddDays(1)
        });

        result.IsError.Should().BeTrue();
        result.FirstError.Description.Should().Contain("Nome");
    }

    [Fact]
    public async Task GetLoteByIdsAsync_Returns_NotFound_When_Missing()
    {
        _repo.Setup(r => r.GetLoteByIdsAsync(1, 9)).ReturnsAsync((Lote)null);

        var result = await _sut.GetLoteByIdsAsync(1, 9);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Lote.Get.NotFound");
    }

    [Fact]
    public async Task AddLote_Maps_AppException()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Lote>()))
            .ThrowsAsync(new ConflictException("BaseRepository.InsertAsync", "Item já cadastrado"));

        var result = await _sut.AddLote(1, new LoteDto
        {
            Nome = "A",
            Preco = 1,
            Quantidade = 1,
            DataIncio = DateTime.UtcNow,
            DataFim = DateTime.UtcNow.AddDays(1)
        });

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
    }
}
