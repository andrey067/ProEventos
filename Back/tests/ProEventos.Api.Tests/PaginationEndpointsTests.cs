using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Api.Tests;

public class PaginationEndpointsTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private sealed class PaginationMeta
    {
        public int CurrentPage { get; set; }
        public int ItemsPerPage { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
    }

    private static PaginationMeta ReadPagination(HttpResponseMessage response)
    {
        response.Headers.TryGetValues("Pagination", out var values).Should().BeTrue();
        var raw = values!.Single();
        var meta = JsonSerializer.Deserialize<PaginationMeta>(raw, JsonOptions);
        meta.Should().NotBeNull();
        return meta!;
    }

    [Fact]
    public async Task Get_Eventos_Returns_Array_Body_With_Pagination_Header_Defaults()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/eventos");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var items = await response.Content.ReadFromJsonAsync<List<EventoDto>>(JsonOptions);
        items.Should().NotBeNull();
        items!.Count.Should().BeLessThanOrEqualTo(10);

        var meta = ReadPagination(response);
        meta.CurrentPage.Should().Be(1);
        meta.ItemsPerPage.Should().Be(10);
        meta.TotalItems.Should().BeGreaterThanOrEqualTo(items.Count);
        if (meta.TotalItems > 0)
            meta.TotalPages.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Get_Eventos_Coerces_Invalid_PageSize_To_10()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/eventos?pageSize=15");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var meta = ReadPagination(response);
        meta.ItemsPerPage.Should().Be(10);
    }

    [Fact]
    public async Task Get_Eventos_With_Tema_And_Page_Filters_Server_Side()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);

        var tema = $"PagTema-{Guid.NewGuid():N}"[..20];
        for (var i = 0; i < 3; i++)
        {
            var create = await client.PostAsJsonAsync("/eventos", new EventoDto
            {
                Tema = $"{tema}-{i}",
                Local = "SP",
                DataEvento = DateTime.UtcNow.AddDays(30).ToString("O"),
                Telefone = "11999999999",
                Email = "pag@test.com",
                QtdPessoas = 10,
                ImagemURL = "e.jpg"
            });
            create.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        var response = await client.GetAsync($"/eventos?tema={tema}&page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = await response.Content.ReadFromJsonAsync<List<EventoDto>>(JsonOptions);
        items!.Should().OnlyContain(e => e.Tema.Contains(tema));
        var meta = ReadPagination(response);
        meta.TotalItems.Should().BeGreaterThanOrEqualTo(3);
    }

    [Fact]
    public async Task Get_Eventos_With_Q_Matches_Local_Globally()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);

        var marker = $"LocQ-{Guid.NewGuid():N}"[..16];
        var create = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "UnrelatedTema",
            Local = marker,
            DataEvento = DateTime.UtcNow.AddDays(30).ToString("O"),
            Telefone = "11999999999",
            Email = "q@test.com",
            QtdPessoas = 10,
            ImagemURL = "e.jpg"
        });
        create.StatusCode.Should().Be(HttpStatusCode.OK);

        var response = await client.GetAsync($"/eventos?q={marker}&page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = await response.Content.ReadFromJsonAsync<List<EventoDto>>(JsonOptions);
        items!.Should().Contain(e => e.Local != null && e.Local.Contains(marker));
        var meta = ReadPagination(response);
        meta.TotalItems.Should().BeGreaterThanOrEqualTo(1);
    }

    [Fact]
    public async Task Get_Palestrantes_With_Q_And_Legacy_Nome_Fallback()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var responseQ = await client.GetAsync("/palestrantes?q=a&page=1&pageSize=10");
        responseQ.StatusCode.Should().Be(HttpStatusCode.OK);
        ReadPagination(responseQ).ItemsPerPage.Should().Be(10);

        var responseNome = await client.GetAsync("/palestrantes?nome=a&page=1&pageSize=10");
        responseNome.StatusCode.Should().Be(HttpStatusCode.OK);
        ReadPagination(responseNome).CurrentPage.Should().Be(1);
    }

    [Fact]
    public async Task Get_Eventos_Clamps_Page_Beyond_Last()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var firstResponse = await client.GetAsync("/eventos?page=1&pageSize=10");
        var firstMeta = ReadPagination(firstResponse);
        if (firstMeta.TotalPages == 0)
            return;

        var response = await client.GetAsync($"/eventos?page={firstMeta.TotalPages + 50}&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var meta = ReadPagination(response);
        meta.CurrentPage.Should().Be(firstMeta.TotalPages);
    }

    [Fact]
    public async Task Get_Palestrantes_Returns_Array_Body_With_Pagination_Header()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/palestrantes?page=1&pageSize=10");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var items = await response.Content.ReadFromJsonAsync<List<PalestranteDto>>(JsonOptions);
        items.Should().NotBeNull();
        items!.Count.Should().BeLessThanOrEqualTo(10);

        var meta = ReadPagination(response);
        meta.CurrentPage.Should().Be(1);
        meta.ItemsPerPage.Should().Be(10);
    }
}
