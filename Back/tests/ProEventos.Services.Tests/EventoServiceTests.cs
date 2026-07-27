using ErrorOr;
using FluentAssertions;
using Moq;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services;
using ProEventos.Services.Dtos;
using ProEventos.Services.Mappings;
using Xunit;

namespace ProEventos.Services.Tests;

public class EventoServiceTests
{
    private readonly Mock<IRepository<Evento>> _repo = new();
    private readonly Mock<IEventoRepository> _eventoRepo = new();
    private readonly EventoService _sut;

    public EventoServiceTests()
    {
        MapsterConfig.Register();
        _sut = new EventoService(_repo.Object, _eventoRepo.Object);
    }

    private static EventoDto SampleDto(int id = 0) => new()
    {
        Id = id,
        Tema = "Meetup DotNet",
        Local = "SP",
        Telefone = "11999999999",
        Email = "a@b.com",
        QtdPessoas = 10,
        ImagemURL = "foto.jpg"
    };

    [Fact]
    public async Task AddEvento_Should_Insert_Not_Update_Or_Delete()
    {
        var dto = SampleDto();
        _repo.Setup(r => r.InsertAsync(It.IsAny<Evento>()))
            .ReturnsAsync((Evento e) => { e.Id = 42; return e; });
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(42, false))
            .ReturnsAsync(new Evento { Id = 42, Tema = dto.Tema, Telefone = dto.Telefone, Email = dto.Email, QtdPessoas = dto.QtdPessoas });

        var result = await _sut.AddEvento(dto);

        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(42);
        _repo.Verify(r => r.InsertAsync(It.IsAny<Evento>()), Times.Once);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Evento>()), Times.Never);
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task UpdateEvento_Should_Update_Not_Delete()
    {
        var dto = SampleDto(7);
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(7, false))
            .ReturnsAsync(new Evento { Id = 7, Tema = "Old" });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Evento>()))
            .ReturnsAsync((Evento e) => e);
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(7, false))
            .ReturnsAsync(new Evento { Id = 7, Tema = "Meetup DotNet", Telefone = dto.Telefone, Email = dto.Email, QtdPessoas = 10 });

        var result = await _sut.UpdateEvento(7, dto);

        result.IsError.Should().BeFalse();
        _repo.Verify(r => r.UpdateAsync(It.Is<Evento>(e => e.Id == 7)), Times.Once);
        _repo.Verify(r => r.DeleteAsync(It.IsAny<int>()), Times.Never);
        _repo.Verify(r => r.InsertAsync(It.IsAny<Evento>()), Times.Never);
    }

    [Fact]
    public async Task DeleteEvento_Should_Delete()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(5, false))
            .ReturnsAsync(new Evento { Id = 5, Tema = "X" });
        _repo.Setup(r => r.DeleteAsync(5)).ReturnsAsync(true);

        var ok = await _sut.DeleteEvento(5);

        ok.IsError.Should().BeFalse();
        ok.Value.Should().Be(Result.Success);
        _repo.Verify(r => r.DeleteAsync(5), Times.Once);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Evento>()), Times.Never);
    }

    [Fact]
    public async Task GetAllEventosByIdAsync_Should_Return_Mapped_Dto()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(1, true))
            .ReturnsAsync(new Evento { Id = 1, Tema = "Tema", Telefone = "11", Email = "a@b.com", QtdPessoas = 2 });

        var result = await _sut.GetAllEventosByIdAsync(1, true);

        result.IsError.Should().BeFalse();
        result.Value.Tema.Should().Be("Tema");
    }

    [Fact]
    public async Task GetAllEventosByTemaAsync_Should_Return_List()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByTemaAsync("net", true))
            .ReturnsAsync(new List<Evento> { new() { Id = 1, Tema = "DotNet" } });

        var result = await _sut.GetAllEventosByTemaAsync("net", true);

        result.IsError.Should().BeFalse();
        result.Value.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetAllEventosAsync_Should_Return_Mapped_List()
    {
        _eventoRepo.Setup(r => r.GetAllEventosAsync(true))
            .ReturnsAsync(new List<Evento> { new() { Id = 1, Tema = "A", Telefone = "11", Email = "a@b.com", QtdPessoas = 1 } });

        var result = await _sut.GetAllEventosAsync(true);

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(e => e.Tema == "A");
    }

    [Fact]
    public async Task Get_Should_Return_Mapped_Dto()
    {
        _repo.Setup(r => r.SelectAsync(3))
            .ReturnsAsync(new Evento { Id = 3, Tema = "X", Telefone = "11", Email = "a@b.com", QtdPessoas = 1 });

        var result = await _sut.Get(3);

        result.IsError.Should().BeFalse();
        result.Value.Id.Should().Be(3);
    }

    [Fact]
    public async Task GetAll_Should_Return_All_Mapped()
    {
        _repo.Setup(r => r.SelectAsyncAll())
            .ReturnsAsync(new List<Evento> { new() { Id = 1, Tema = "T", Telefone = "11", Email = "a@b.com", QtdPessoas = 1 } });

        var result = await _sut.GetAll();

        result.IsError.Should().BeFalse();
        result.Value.Should().ContainSingle(e => e.Tema == "T");
    }

    [Fact]
    public async Task UpdateEvento_Should_Return_NotFound_When_Missing()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(99, false)).ReturnsAsync((Evento)null);

        var result = await _sut.UpdateEvento(99, SampleDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
        result.FirstError.Code.Should().Be("Evento.Update.NotFound");
    }

    [Fact]
    public async Task UpdateEvento_Should_Return_NotFound_When_Update_Fails()
    {
        var dto = SampleDto(8);
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(8, false))
            .ReturnsAsync(new Evento { Id = 8, Tema = "Old" });
        _repo.Setup(r => r.UpdateAsync(It.IsAny<Evento>())).ReturnsAsync((Evento)null);

        var result = await _sut.UpdateEvento(8, dto);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task DeleteEvento_Should_Return_NotFound_When_Missing()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(404, false)).ReturnsAsync((Evento)null);

        var result = await _sut.DeleteEvento(404);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Evento.Delete.NotFound");
    }

    [Fact]
    public async Task AddEvento_Should_Propagate_Unexpected_Exception()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Evento>())).ThrowsAsync(new InvalidOperationException("db"));

        var act = () => _sut.AddEvento(SampleDto());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("db");
    }

    [Fact]
    public async Task AddEvento_Should_Map_AppException()
    {
        _repo.Setup(r => r.InsertAsync(It.IsAny<Evento>()))
            .ThrowsAsync(new ConflictException("BaseRepository.InsertAsync", "Item já cadastrado"));

        var result = await _sut.AddEvento(SampleDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Conflict);
        result.FirstError.Code.Should().Be("BaseRepository.InsertAsync");
    }

    [Fact]
    public async Task Get_Should_Return_NotFound_When_Missing()
    {
        _repo.Setup(r => r.SelectAsync(1)).ReturnsAsync((Evento)null);

        var result = await _sut.Get(1);

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Evento.Get.NotFound");
    }

    [Fact]
    public async Task GetAllEventosByIdAsync_Should_Return_NotFound_When_Missing()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(1, true)).ReturnsAsync((Evento)null);

        var result = await _sut.GetAllEventosByIdAsync(1, true);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }

    [Fact]
    public async Task GetAllEventosAsync_Should_Return_Empty_When_Null()
    {
        _eventoRepo.Setup(r => r.GetAllEventosAsync(false)).ReturnsAsync((List<Evento>)null);

        var result = await _sut.GetAllEventosAsync(false);

        result.IsError.Should().BeFalse();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllEventosByTemaAsync_Should_Return_Empty_When_Null()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByTemaAsync("x", false)).ReturnsAsync((List<Evento>)null);

        var result = await _sut.GetAllEventosByTemaAsync("x", false);

        result.IsError.Should().BeFalse();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteEvento_Should_Map_AppException()
    {
        _eventoRepo.Setup(r => r.GetAllEventosByIdAsync(5, false))
            .ReturnsAsync(new Evento { Id = 5, Tema = "X" });
        _repo.Setup(r => r.DeleteAsync(5))
            .ThrowsAsync(new NotFoundException("BaseRepository.DeleteAsync", "Item não encontrado"));

        var result = await _sut.DeleteEvento(5);

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.NotFound);
    }
}
