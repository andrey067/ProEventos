using ErrorOr;
using FluentAssertions;
using ProEventos.Domain.Exceptions;
using ProEventos.Services.Errors;
using Xunit;

namespace ProEventos.Services.Tests;

public class AppExceptionExtensionsTests
{
    [Fact]
    public void ToError_Maps_NotFoundException()
    {
        var error = new NotFoundException("BaseRepository.DeleteAsync", "Item não encontrado").ToError();

        error.Type.Should().Be(ErrorType.NotFound);
        error.Code.Should().Be("BaseRepository.DeleteAsync");
        error.Description.Should().Be("Item não encontrado");
    }

    [Fact]
    public void ToError_Maps_ConflictException()
    {
        var error = new ConflictException("BaseRepository.InsertAsync", "Item já cadastrado").ToError();

        error.Type.Should().Be(ErrorType.Conflict);
        error.Code.Should().Be("BaseRepository.InsertAsync");
    }

    [Fact]
    public void ToError_Maps_PersistenceException()
    {
        var error = new PersistenceException("BaseRepository.Save", "falha").ToError();

        error.Type.Should().Be(ErrorType.Failure);
        error.Code.Should().Be("BaseRepository.Save");
    }

    [Fact]
    public void ToError_Maps_Unknown_AppException_As_Failure()
    {
        AppException ex = new TestAppException(AppLayer.Service, "Custom.Op", "msg");
        var error = ex.ToError();

        error.Type.Should().Be(ErrorType.Failure);
        error.Code.Should().Be("Custom.Op");
    }

    private sealed class TestAppException : AppException
    {
        public TestAppException(AppLayer layer, string operation, string message)
            : base(layer, operation, message)
        {
        }
    }
}
