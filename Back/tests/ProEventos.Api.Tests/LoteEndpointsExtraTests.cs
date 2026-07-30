using System.Net;
using FluentAssertions;
using Xunit;

namespace ProEventos.Api.Tests;

public class LoteEndpointsExtraTests
{
    [Fact]
    public async Task Lotes_Delete_Returns_NotFound_On_Exception()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.LoginAsAdminAsync(client);

        (await client.DeleteAsync("/lotes/999999/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
