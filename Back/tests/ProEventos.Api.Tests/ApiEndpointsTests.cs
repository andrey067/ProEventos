using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Api.Tests;

public class ApiEndpointsTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static (CustomWebApplicationFactory factory, HttpClient client) CreateClient()
    {
        var factory = new CustomWebApplicationFactory();
        return (factory, factory.CreateClient());
    }

    private static EventoDto SampleEventoDto(string tema = "Api Meetup") => new()
    {
        Tema = tema,
        Local = "SP",
        DataEvento = DateTime.UtcNow.AddDays(30).ToString("O"),
        Telefone = "11999999999",
        Email = "api@test.com",
        QtdPessoas = 20,
        ImagemURL = "evento.jpg"
    };

    [Fact]
    public async Task Eventos_Crud_Smoke()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var tema = $"Tema-{Guid.NewGuid():N}";
        var create = await client.PostAsJsonAsync("/eventos", SampleEventoDto(tema));
        create.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await create.Content.ReadFromJsonAsync<EventoDto>(JsonOptions);
        created!.Id.Should().BeGreaterThan(0);

        (await client.GetAsync($"/eventos/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync($"/eventos/tema/{tema.ToLowerInvariant()}")).StatusCode.Should().Be(HttpStatusCode.OK);

        created.Tema = $"{tema} Updated";
        (await client.PutAsJsonAsync($"/eventos/{created.Id}", created)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/eventos/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync($"/eventos/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Eventos_NotFound_And_Delete_Missing()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        (await client.GetAsync("/eventos/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.PutAsJsonAsync("/eventos/999999", SampleEventoDto())).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.DeleteAsync("/eventos/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Lotes_Crud_Smoke()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);

        (await client.GetAsync($"/lotes/{evento.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);

        var lotes = new List<LoteDto>
        {
            new()
            {
                Nome = "VIP",
                Preco = 100,
                Quantidade = 5,
                DataIncio = DateTime.UtcNow,
                DataFim = DateTime.UtcNow.AddDays(1)
            }
        };
        var save = await client.PutAsJsonAsync($"/lotes/{evento.Id}", lotes);
        save.StatusCode.Should().Be(HttpStatusCode.OK);
        var saved = await save.Content.ReadFromJsonAsync<List<LoteDto>>(JsonOptions);
        var loteId = saved![0].Id;

        (await client.DeleteAsync($"/lotes/{evento.Id}/{loteId}")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Lotes_Delete_NotFound_And_Null_Body()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);
        (await client.DeleteAsync($"/lotes/{evento.Id}/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.PutAsJsonAsync<List<LoteDto>>($"/lotes/{evento.Id}", null)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Palestrantes_Crud_Smoke()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var organizerAuth = client.DefaultRequestHeaders.Authorization;

        var speaker = await AuthTestHelper.RegisterPalestranteAsync(client);
        client.DefaultRequestHeaders.Authorization = organizerAuth;

        var get = await client.GetAsync($"/palestrantes/{speaker.PalestranteId}");
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        var created = await get.Content.ReadFromJsonAsync<PalestranteDto>(JsonOptions);

        (await client.GetAsync("/palestrantes")).StatusCode.Should().Be(HttpStatusCode.OK);

        created!.Nome = "Speaker Updated";
        (await client.PutAsJsonAsync($"/palestrantes/{created.Id}", created)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/palestrantes/{created.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Palestrantes_NotFound_Paths()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        (await client.GetAsync("/palestrantes/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.PutAsJsonAsync("/palestrantes/999999", new PalestranteDto { Nome = "X", UserId = "missing" }))
            .StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.BadRequest);
        (await client.DeleteAsync("/palestrantes/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RedesSociais_Evento_And_Palestrante_Smoke()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);
        var palestrante = await CreatePalestranteAsync(client);

        (await client.GetAsync($"/redes-sociais/evento/{evento.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);

        var saveEvento = await client.PutAsJsonAsync($"/redes-sociais/evento/{evento.Id}",
            new List<RedeSocialDto> { new() { Nome = "IG", URL = "https://instagram.com/e" } });
        var savedEvento = await saveEvento.Content.ReadFromJsonAsync<List<RedeSocialDto>>(JsonOptions);
        var redeEventoId = savedEvento![0].Id;

        (await client.DeleteAsync($"/redes-sociais/evento/{evento.Id}/{redeEventoId}")).StatusCode.Should().Be(HttpStatusCode.OK);

        (await client.GetAsync($"/redes-sociais/palestrante/{palestrante.Id}")).StatusCode.Should().Be(HttpStatusCode.OK);

        var savePalestrante = await client.PutAsJsonAsync($"/redes-sociais/palestrante/{palestrante.Id}",
            new List<RedeSocialDto> { new() { Nome = "LI", URL = "https://linkedin.com/p" } });
        var savedPalestrante = await savePalestrante.Content.ReadFromJsonAsync<List<RedeSocialDto>>(JsonOptions);
        var redePalestranteId = savedPalestrante![0].Id;

        (await client.DeleteAsync($"/redes-sociais/palestrante/{palestrante.Id}/{redePalestranteId}")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RedesSociais_NotFound_And_Null_Body()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);
        var palestrante = await CreatePalestranteAsync(client);

        (await client.DeleteAsync($"/redes-sociais/evento/{evento.Id}/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.DeleteAsync($"/redes-sociais/palestrante/{palestrante.Id}/999999")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await client.PutAsJsonAsync<List<RedeSocialDto>>($"/redes-sociais/evento/{evento.Id}", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PutAsJsonAsync<List<RedeSocialDto>>($"/redes-sociais/palestrante/{palestrante.Id}", null)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_Eventos_List_Returns_Ok()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        (await client.GetAsync("/eventos")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task OpenApi_Scalar_And_Cors_Are_Available_In_Development()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        (await client.GetAsync("/openapi/v1.json")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync("/scalar/v1")).StatusCode.Should().Be(HttpStatusCode.OK);

        var preflight = new HttpRequestMessage(HttpMethod.Options, "/eventos");
        preflight.Headers.Add("Origin", "http://localhost:5173");
        preflight.Headers.Add("Access-Control-Request-Method", "GET");
        var cors = await client.SendAsync(preflight);
        cors.Headers.Contains("Access-Control-Allow-Origin").Should().BeTrue();
    }

    [Fact]
    public async Task Lotes_Update_Existing_Via_Save()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);
        var lotes = new List<LoteDto>
        {
            new()
            {
                Nome = "Batch",
                Preco = 10,
                Quantidade = 1,
                DataIncio = DateTime.UtcNow,
                DataFim = DateTime.UtcNow.AddDays(1)
            }
        };
        var saved = await (await client.PutAsJsonAsync($"/lotes/{evento.Id}", lotes))
            .Content.ReadFromJsonAsync<List<LoteDto>>(JsonOptions);
        var existing = saved![0];
        existing.Nome = "Batch Updated";

        var updated = await client.PutAsJsonAsync($"/lotes/{evento.Id}", new List<LoteDto> { existing });
        var body = await updated.Content.ReadFromJsonAsync<List<LoteDto>>(JsonOptions);
        body![0].Nome.Should().Be("Batch Updated");
    }

    [Fact]
    public async Task RedesSociais_Update_Existing_Via_Save()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);
        var evento = await CreateEventoAsync(client);
        var saved = await (await client.PutAsJsonAsync($"/redes-sociais/evento/{evento.Id}",
                new List<RedeSocialDto> { new() { Nome = "TW", URL = "https://tw" } }))
            .Content.ReadFromJsonAsync<List<RedeSocialDto>>(JsonOptions);
        var existing = saved![0];
        existing.Nome = "TW Updated";

        var body = await (await client.PutAsJsonAsync($"/redes-sociais/evento/{evento.Id}", new List<RedeSocialDto> { existing }))
            .Content.ReadFromJsonAsync<List<RedeSocialDto>>(JsonOptions);
        body![0].Nome.Should().Be("TW Updated");
    }

    private static async Task<EventoDto> CreateEventoAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/eventos", SampleEventoDto());
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<EventoDto>(JsonOptions))!;
    }

    private static async Task<PalestranteDto> CreatePalestranteAsync(HttpClient client)
    {
        var organizerAuth = client.DefaultRequestHeaders.Authorization;
        var speaker = await AuthTestHelper.RegisterPalestranteAsync(client);
        client.DefaultRequestHeaders.Authorization = organizerAuth;

        var response = await client.GetAsync($"/palestrantes/{speaker.PalestranteId}");
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<PalestranteDto>(JsonOptions))!;
    }
}
