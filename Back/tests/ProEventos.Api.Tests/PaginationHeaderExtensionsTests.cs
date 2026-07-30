using System.Net;
using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using ProEventos.Api.Extensions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Api.Tests;

public class PaginationHeaderExtensionsTests
{
    [Fact]
    public async Task ToPagedHttpResult_Error_Delegates_To_Error_Mapping()
    {
        ErrorOr<PageResultDto<string>> result = Error.NotFound("Paged.NotFound", "missing");

        var httpResult = result.ToPagedHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ToPagedHttpResult_Success_Writes_Header_And_Null_Items_As_Empty_Array()
    {
        var page = new PageResultDto<string>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 0,
            TotalPages = 0,
            Items = null
        };

        ErrorOr<PageResultDto<string>> result = page;
        var httpResult = result.ToPagedHttpResult();
        var context = CreateContext();

        await httpResult.ExecuteAsync(context);

        context.Response.StatusCode.Should().Be((int)HttpStatusCode.OK);
        context.Response.Headers[PaginationHeaderExtensions.HeaderName].ToString().Should().Contain("\"currentPage\":1");
        var body = await ReadBodyAsync(context);
        body.Should().Be("[]");
    }

    [Fact]
    public void SerializeMeta_Uses_CamelCase()
    {
        var meta = PaginationHeaderExtensions.SerializeMeta(new PageResultDto<int>
        {
            Page = 2,
            PageSize = 5,
            TotalCount = 12,
            TotalPages = 3,
            Items = new List<int> { 1, 2 }
        });

        meta.Should().Contain("\"currentPage\":2");
        meta.Should().Contain("\"itemsPerPage\":5");
        meta.Should().Contain("\"totalItems\":12");
        meta.Should().Contain("\"totalPages\":3");
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
