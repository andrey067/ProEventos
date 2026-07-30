using System.Net;
using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using ProEventos.Api.Extensions;
using Xunit;

namespace ProEventos.Api.Tests;

public class ErrorOrHttpResultExtensionsTests
{
    [Fact]
    public async Task ToHttpResult_Success_Returns_Default_Ok_Message_For_Success_Type()
    {
        ErrorOr<Success> result = Result.Success;

        var httpResult = result.ToHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        var body = await ReadBodyAsync(context);
        body.Should().Contain("Ok");
    }

    [Fact]
    public async Task ToHttpResult_Success_Returns_Value_When_Not_Success_Type()
    {
        ErrorOr<string> result = "payload";

        var httpResult = result.ToHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        var body = await ReadBodyAsync(context);
        body.Should().Contain("payload");
    }

    [Fact]
    public async Task ToHttpResult_Success_Uses_OnValue_Callback_When_Provided()
    {
        ErrorOr<int> result = 42;

        var httpResult = result.ToHttpResult(v => Results.Text($"value:{v}"));
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        var body = await ReadBodyAsync(context);
        body.Should().Be("value:42");
    }

    [Fact]
    public async Task ToHttpResult_SuccessBody_Overload_Returns_Custom_Body()
    {
        ErrorOr<Success> result = Result.Success;

        var httpResult = result.ToHttpResult(new { message = "Deletado" });
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        var body = await ReadBodyAsync(context);
        body.Should().Contain("Deletado");
    }

    [Theory]
    [InlineData("not-found", HttpStatusCode.NotFound)]
    [InlineData("validation", HttpStatusCode.BadRequest)]
    [InlineData("conflict", HttpStatusCode.Conflict)]
    [InlineData("unauthorized", HttpStatusCode.Unauthorized)]
    [InlineData("forbidden", HttpStatusCode.Forbidden)]
    [InlineData("failure", HttpStatusCode.BadRequest)]
    public async Task ToHttpResult_Maps_Error_Types(string kind, HttpStatusCode expectedStatus)
    {
        var error = kind switch
        {
            "not-found" => Error.NotFound("Svc.NotFound", "missing"),
            "validation" => Error.Validation("Svc.Validation", "invalid"),
            "conflict" => Error.Conflict("Svc.Conflict", "duplicate"),
            "unauthorized" => Error.Unauthorized("Svc.Unauthorized", "denied"),
            "forbidden" => Error.Forbidden("Svc.Forbidden", "forbidden"),
            _ => Error.Failure("Svc.Failure", "failed")
        };

        ErrorOr<string> result = error;
        var httpResult = result.ToHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)expectedStatus);
        var body = await ReadBodyAsync(context);
        body.Should().Contain(error.Code);
        body.Should().Contain(error.Description);
    }

    [Theory]
    [InlineData("", "Service")]
    [InlineData("BaseRepository.DeleteAsync", "Persistence")]
    [InlineData("Entity.Persistence.Save", "Persistence")]
    [InlineData("Account.Login", "Service")]
    public async Task ToHttpResult_Infers_Layer_From_Error_Code(string code, string expectedLayer)
    {
        ErrorOr<string> result = Error.NotFound(code, "missing");
        var httpResult = result.ToHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        var body = await ReadBodyAsync(context);
        body.Should().Contain($"\"layer\":\"{expectedLayer}\"");
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
}
