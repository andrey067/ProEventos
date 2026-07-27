using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Persistence.Repository;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class BaseRepositoryTests
{
    private static EventoRepository CreateRepo(out DataContext ctx)
    {
        ctx = DataContextFactory.Create();
        return new EventoRepository(ctx);
    }

    private static Evento SampleEvento(int id = 0) => new()
    {
        Id = id,
        Tema = "Meetup",
        Local = "SP",
        Telefone = "11999999999",
        Email = "a@b.com",
        QtdPessoas = 10,
        ImagemURL = "foto.jpg"
    };

    [Fact]
    public async Task InsertAsync_SelectAsync_UpdateAsync_DeleteAsync_Flow()
    {
        var repo = CreateRepo(out var ctx);
        var inserted = await repo.InsertAsync(SampleEvento());

        inserted.Id.Should().BeGreaterThan(0);
        inserted.CreateAt.Should().NotBeNull();

        var selected = await repo.SelectAsync(inserted.Id);
        selected!.Tema.Should().Be("Meetup");

        selected.Tema = "Updated";
        var updated = await repo.UpdateAsync(selected);
        updated!.Tema.Should().Be("Updated");
        updated.UpdateAt.Should().NotBeNull();

        (await repo.ExistAsync(inserted.Id)).Should().BeTrue();
        (await repo.DeleteAsync(inserted.Id)).Should().BeTrue();
        (await repo.ExistAsync(inserted.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task SelectAsyncAll_Returns_All_Items()
    {
        var repo = CreateRepo(out _);
        await repo.InsertAsync(SampleEvento());
        await repo.InsertAsync(SampleEvento());

        var all = await repo.SelectAsyncAll();

        all.Should().HaveCount(2);
    }

    [Fact]
    public async Task UpdateAsync_Returns_Null_When_Not_Found()
    {
        var repo = CreateRepo(out _);
        var result = await repo.UpdateAsync(SampleEvento(999));
        result.Should().BeNull();
    }

    [Fact]
    public async Task DeleteAsync_Throws_When_Not_Exists()
    {
        var repo = CreateRepo(out _);
        var act = () => repo.DeleteAsync(404);
        await act.Should().ThrowAsync<NotFoundException>().WithMessage("*não encontrado*");
    }

    [Fact]
    public async Task InsertAsync_Throws_When_Id_Already_Exists()
    {
        var repo = CreateRepo(out _);
        var item = SampleEvento();
        await repo.InsertAsync(item);

        var duplicate = SampleEvento(item.Id);
        var act = () => repo.InsertAsync(duplicate);
        await act.Should().ThrowAsync<ConflictException>().WithMessage("*já cadastrado*");
    }

    [Fact]
    public async Task SaveChangesAsync_And_DeleteRange_Work()
    {
        var repo = CreateRepo(out var ctx);
        var a = await repo.InsertAsync(SampleEvento());
        var b = await repo.InsertAsync(SampleEvento());

        (await repo.SaveChangesAsync()).Should().BeFalse();

        repo.DeleteRange(new[] { a, b });
        (await repo.SaveChangesAsync()).Should().BeTrue();

        (await repo.SelectAsyncAll()).Should().BeEmpty();
    }
}
