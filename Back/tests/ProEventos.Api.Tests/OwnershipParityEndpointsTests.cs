using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Api.Tests;

public class OwnershipParityEndpointsTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static EventoDto SampleEvento(string tema = "Ownership Meetup") => new()
    {
        Tema = tema,
        Local = "SP",
        DataEvento = "2026-12-01",
        QtdPessoas = 100,
        Telefone = "11999999999",
        Email = "evt@test.com",
        ImagemURL = "foto.jpg"
    };

    [Fact]
    public async Task Evento_Mutations_Deny_Non_Owner()
    {
        using var factory = new CustomWebApplicationFactory();
        var owner = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(owner, "own1");

        var create = await owner.PostAsJsonAsync("/eventos", SampleEvento());
        create.StatusCode.Should().Be(HttpStatusCode.OK);
        var evento = await create.Content.ReadFromJsonAsync<EventoDto>(JsonOptions);
        evento.Should().NotBeNull();
        evento!.UserId.Should().NotBeNullOrWhiteSpace();

        var other = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(other, "oth1");

        (await other.PutAsJsonAsync($"/eventos/{evento.Id}", SampleEvento("Hacked")))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await other.DeleteAsync($"/eventos/{evento.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await other.PutAsJsonAsync($"/redes-sociais/evento/{evento.Id}",
                new List<RedeSocialDto> { new() { Id = 0, Nome = "X", URL = "https://x.com" } }))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);

        (await owner.PutAsJsonAsync($"/redes-sociais/evento/{evento.Id}",
                new List<RedeSocialDto> { new() { Id = 0, Nome = "IG", URL = "https://ig.com" } }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RedeSocial_Palestrante_Self_Scoped_Works()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        var auth = await AuthTestHelper.RegisterPalestranteAsync(client, "rs1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);

        var getMine = await client.GetAsync("/redes-sociais/palestrante");
        getMine.StatusCode.Should().Be(HttpStatusCode.OK);

        var save = await client.PutAsJsonAsync("/redes-sociais/palestrante",
            new List<RedeSocialDto> { new() { Id = 0, Nome = "LinkedIn", URL = "https://linkedin.com/in/x" } });
        save.StatusCode.Should().Be(HttpStatusCode.OK);
        var redes = await save.Content.ReadFromJsonAsync<List<RedeSocialDto>>(JsonOptions);
        redes.Should().ContainSingle(r => r.Nome == "LinkedIn");
        var redeId = redes![0].Id;

        (await client.DeleteAsync($"/redes-sociais/palestrante/{redeId}"))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RedeSocial_Palestrante_Self_Scoped_Requires_Profile()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client, "nopal");

        (await client.GetAsync("/redes-sociais/palestrante"))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Palestrante_Me_And_Self_Update()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        var auth = await AuthTestHelper.RegisterPalestranteAsync(client, "me1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);

        var me = await client.GetAsync("/palestrantes/me");
        me.StatusCode.Should().Be(HttpStatusCode.OK);
        var dto = await me.Content.ReadFromJsonAsync<PalestranteDto>(JsonOptions);
        dto.Should().NotBeNull();

        dto!.MiniCurriculo = "Atualizado via me";
        var put = await client.PutAsJsonAsync($"/palestrantes/{dto.Id}", dto);
        put.StatusCode.Should().Be(HttpStatusCode.OK);

        var other = factory.CreateClient();
        var auth2 = await AuthTestHelper.RegisterPalestranteAsync(other, "me2");
        other.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth2.Token);

        (await other.PutAsJsonAsync($"/palestrantes/{dto.Id}", dto))
            .StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Organizer_Can_Update_Any_Palestrante()
    {
        using var factory = new CustomWebApplicationFactory();
        var speaker = factory.CreateClient();
        var auth = await AuthTestHelper.RegisterPalestranteAsync(speaker, "orgp");
        speaker.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        var me = await (await speaker.GetAsync("/palestrantes/me")).Content.ReadFromJsonAsync<PalestranteDto>(JsonOptions);

        var admin = factory.CreateClient();
        await AuthTestHelper.LoginAsAdminAsync(admin);
        me!.MiniCurriculo = "Admin edit";
        (await admin.PutAsJsonAsync($"/palestrantes/{me.Id}", me))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
