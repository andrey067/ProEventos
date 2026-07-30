using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using ProEventos.Api.Exceptions;
using ProEventos.Domain.Exceptions;
using Xunit;

namespace ProEventos.Api.Tests;

public class AppExceptionHandlerTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Theory]
    [InlineData(typeof(NotFoundException), HttpStatusCode.NotFound, "NotFoundException")]
    [InlineData(typeof(ConflictException), HttpStatusCode.Conflict, "ConflictException")]
    [InlineData(typeof(PersistenceException), HttpStatusCode.InternalServerError, "PersistenceException")]
    public async Task TryHandleAsync_Maps_AppExceptions_To_ProblemDetails(
        Type exceptionType,
        HttpStatusCode expectedStatus,
        string expectedTitle)
    {
        var exception = (AppException)Activator.CreateInstance(
            exceptionType,
            "Test.Operation",
            "Test message")!;

        var context = CreateContext();
        var handler = new AppExceptionHandler(NullLogger<AppExceptionHandler>.Instance, new TestProblemDetailsService());

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be((int)expectedStatus);
        var body = await ReadBodyAsync(context);
        body.Should().Contain(expectedTitle);
        body.Should().Contain("Test message");
        body.Should().Contain("Test.Operation");
    }

    [Fact]
    public async Task TryHandleAsync_Maps_Unhandled_Exception_To_InternalServerError()
    {
        var context = CreateContext();
        var handler = new AppExceptionHandler(NullLogger<AppExceptionHandler>.Instance, new TestProblemDetailsService());
        var exception = new InvalidOperationException("boom");

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        handled.Should().BeTrue();
        context.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        var body = await ReadBodyAsync(context);
        body.Should().Contain("An unexpected error occurred.");
        body.Should().Contain("boom");
    }

    [Fact]
    public async Task TryHandleAsync_Includes_AppException_Extensions()
    {
        var context = CreateContext();
        var handler = new AppExceptionHandler(NullLogger<AppExceptionHandler>.Instance, new TestProblemDetailsService());
        var exception = new NotFoundException("Test.NotFound", "Item não encontrado");

        await handler.TryHandleAsync(context, exception, CancellationToken.None);

        using var doc = JsonDocument.Parse(await ReadBodyAsync(context));
        var root = doc.RootElement;
        root.GetProperty("layer").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("operation").GetString().Should().Be("Test.NotFound");
        root.GetProperty("code").GetString().Should().Be("Test.NotFound");
    }

    private static DefaultHttpContext CreateContext()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddOptions();
        var context = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<string> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        return await reader.ReadToEndAsync();
    }

    private sealed class TestProblemDetailsService : IProblemDetailsService
    {
        public ValueTask WriteAsync(ProblemDetailsContext context) =>
            throw new NotSupportedException();

        public async ValueTask<bool> TryWriteAsync(ProblemDetailsContext context)
        {
            await context.HttpContext.Response.WriteAsJsonAsync(context.ProblemDetails, JsonOptions);
            return true;
        }
    }
}
