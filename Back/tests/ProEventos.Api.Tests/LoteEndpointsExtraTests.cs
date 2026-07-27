using System.Net;
using System.Net.Http.Json;
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
        await AuthTestHelper.AuthenticateAsync(client);

        var eventoResponse = await client.PostAsJsonAsync("/eventos", new
        {
            tema = "LoteDelete",
            local = "SP",
            dataEvento = DateTime.UtcNow.AddDays(10).ToString("O"),
            telefone = "11999999999",
            email = "l@t.com",
            qtdPessoas = 10,
            imagemURL = "evento.jpg"
        });
        eventoResponse.EnsureSuccessStatusCode();

        (await client.DeleteAsync("/lotes/999999/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
