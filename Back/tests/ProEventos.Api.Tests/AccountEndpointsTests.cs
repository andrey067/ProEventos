using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Api.Tests;

public class AccountEndpointsTests
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    [Fact]
    public async Task Register_Login_Profile_And_ChangePassword_Flow()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        var suffix = Guid.NewGuid().ToString("N")[..8];

        var register = await client.PostAsJsonAsync("/account/register", new UserRegisterDto
        {
            Nome = "Org",
            UserName = $"org_{suffix}",
            Email = $"org_{suffix}@test.com",
            Password = "Senha@123"
        });
        register.StatusCode.Should().Be(HttpStatusCode.OK);
        var auth = await register.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        auth!.Token.Should().NotBeNullOrWhiteSpace();
        auth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        auth.ExpiresIn.Should().BeGreaterThan(0);
        auth.Roles.Should().Contain("User");
        auth.PalestranteId.Should().BeNull();

        var dup = await client.PostAsJsonAsync("/account/register", new UserRegisterDto
        {
            Nome = "Org2",
            UserName = $"org2_{suffix}",
            Email = $"org_{suffix}@test.com",
            Password = "Senha@123"
        });
        dup.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var login = await client.PostAsJsonAsync("/account/login", new UserLoginDto
        {
            UserName = $"org_{suffix}",
            Password = "Senha@123"
        });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var loginAuth = await login.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        loginAuth!.RefreshToken.Should().NotBeNullOrWhiteSpace();

        var badLogin = await client.PostAsJsonAsync("/account/login", new UserLoginDto
        {
            UserName = $"org_{suffix}",
            Password = "wrong"
        });
        badLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth.Token);

        var profile = await client.GetAsync("/account/profile");
        profile.StatusCode.Should().Be(HttpStatusCode.OK);
        var profileDto = await profile.Content.ReadFromJsonAsync<UserDto>(JsonOptions);
        profileDto!.ImagemURL.Should().NotBeNullOrWhiteSpace();
        profileDto.ImagemURL.Should().StartWith("https://images.unsplash.com/");
        profileDto.PrimeiroNome.Should().NotBeNullOrWhiteSpace();
        profileDto.EventosParticipados.Should().Be(0);

        var updated = await client.PutAsJsonAsync("/account/profile", new UserUpdateDto
        {
            PrimeiroNome = "Org",
            UltimoNome = "Updated",
            Email = $"org_{suffix}@test.com",
            UserName = $"org_{suffix}",
            Titulo = ProEventos.Domain.Enum.Titulo.Bacharel,
            Funcao = ProEventos.Domain.Enum.Funcao.Participante,
            Telefone = "11988887777",
            Descricao = "Organizador de eventos"
        });
        updated.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedDto = await updated.Content.ReadFromJsonAsync<UserDto>(JsonOptions);
        updatedDto!.Telefone.Should().Be("11988887777");
        updatedDto.Descricao.Should().Be("Organizador de eventos");
        updatedDto.Nome.Should().Be("Org Updated");
        updatedDto.PrimeiroNome.Should().Be("Org");
        updatedDto.UltimoNome.Should().Be("Updated");

        var profileAfterSet = await client.GetAsync("/account/profile");
        profileAfterSet.StatusCode.Should().Be(HttpStatusCode.OK);
        var profileAfterSetDto = await profileAfterSet.Content.ReadFromJsonAsync<UserDto>(JsonOptions);
        profileAfterSetDto!.Telefone.Should().Be("11988887777");
        profileAfterSetDto.Descricao.Should().Be("Organizador de eventos");

        var oldRefresh = auth.RefreshToken;

        var pwd = await client.PutAsJsonAsync("/account/change-password", new ChangePasswordDto
        {
            CurrentPassword = "Senha@123",
            NewPassword = "Senha@456"
        });
        pwd.StatusCode.Should().Be(HttpStatusCode.OK);
        var pwdAuth = await pwd.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        pwdAuth!.Token.Should().NotBeNullOrWhiteSpace();
        pwdAuth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        pwdAuth.RefreshToken.Should().NotBe(oldRefresh);

        var reusedOldRefresh = await client.PostAsJsonAsync("/account/refresh-token", new RefreshTokenRequestDto
        {
            RefreshToken = oldRefresh
        });
        reusedOldRefresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", pwdAuth.Token);

        var badPwd = await client.PutAsJsonAsync("/account/change-password", new ChangePasswordDto
        {
            CurrentPassword = "nope",
            NewPassword = "x"
        });
        badPwd.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RefreshToken_Returns_New_Pair_And_OneTime_Invalidates_Old()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        var suffix = Guid.NewGuid().ToString("N")[..8];

        var register = await client.PostAsJsonAsync("/account/register", new UserRegisterDto
        {
            Nome = "Refresh User",
            UserName = $"ref_{suffix}",
            Email = $"ref_{suffix}@test.com",
            Password = "Senha@123"
        });
        register.EnsureSuccessStatusCode();
        var auth = await register.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        var oldRefresh = auth!.RefreshToken;
        oldRefresh.Should().NotBeNullOrWhiteSpace();

        var refreshed = await client.PostAsJsonAsync("/account/refresh-token", new RefreshTokenRequestDto
        {
            RefreshToken = oldRefresh
        });
        refreshed.StatusCode.Should().Be(HttpStatusCode.OK);
        var newAuth = await refreshed.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        newAuth!.Token.Should().NotBeNullOrWhiteSpace();
        newAuth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        newAuth.RefreshToken.Should().NotBe(oldRefresh);
        newAuth.Roles.Should().Contain("User");

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", newAuth.Token);
        (await client.GetAsync("/account/profile")).StatusCode.Should().Be(HttpStatusCode.OK);

        var reused = await client.PostAsJsonAsync("/account/refresh-token", new RefreshTokenRequestDto
        {
            RefreshToken = oldRefresh
        });
        reused.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RefreshToken_Invalid_Returns_Unauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/account/refresh-token", new RefreshTokenRequestDto
        {
            RefreshToken = "not-a-valid-refresh-token"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Mutating_Evento_Without_Token_Returns_Unauthorized()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "NoAuth",
            Local = "SP",
            DataEvento = DateTime.UtcNow.ToString("O"),
            Telefone = "11999999999",
            Email = "a@b.com",
            QtdPessoas = 1,
            ImagemURL = "evento.jpg"
        });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Palestrantes_Search_And_Associate()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);

        var eventoRes = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "Angular Summit",
            Local = "SP",
            DataEvento = DateTime.UtcNow.AddDays(1).ToString("O"),
            Telefone = "11999999999",
            Email = "e@t.com",
            QtdPessoas = 10,
            ImagemURL = "evento.jpg"
        });
        eventoRes.EnsureSuccessStatusCode();
        var evento = await eventoRes.Content.ReadFromJsonAsync<EventoDto>(JsonOptions);

        var palRes = await client.PostAsJsonAsync("/palestrantes", new PalestranteDto
        {
            Nome = "Ada Lovelace",
            Email = "ada@t.com",
            UserId = "missing-user"
        });
        palRes.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var organizerAuth = client.DefaultRequestHeaders.Authorization;
        var speaker = await AuthTestHelper.RegisterPalestranteAsync(client, suffix: Guid.NewGuid().ToString("N")[..8]);
        speaker.PalestranteId.Should().NotBeNull();
        var palId = speaker.PalestranteId!.Value;

        client.DefaultRequestHeaders.Authorization = organizerAuth;

        (await client.PutAsync($"/eventos/{evento!.Id}/palestrantes/{palId}", null)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync("/palestrantes/nome/Speaker")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.GetAsync("/palestrantes/tema/Angular")).StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.DeleteAsync($"/eventos/{evento.Id}/palestrantes/{palId}")).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RegisterPalestrante_Returns_ReadOnly_Role_And_Cannot_Write_Eventos()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var auth = await AuthTestHelper.RegisterPalestranteAsync(client);
        auth.Roles.Should().Contain("Palestrante");
        auth.Roles.Should().NotContain("User");
        auth.PalestranteId.Should().NotBeNull();

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth.Token);

        var write = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "Should Fail",
            Local = "SP",
            DataEvento = DateTime.UtcNow.AddDays(1).ToString("O"),
            Telefone = "11999999999",
            Email = "e@t.com",
            QtdPessoas = 10,
            ImagemURL = "evento.jpg"
        });
        write.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Seeded_Palestrante_Login_Is_ReadOnly_While_Admin_Can_Write()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();

        var palAuth = await AuthTestHelper.LoginAsPalestranteAsync(client);
        palAuth.Roles.Should().Contain("Palestrante");

        var denied = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "Denied",
            Local = "SP",
            DataEvento = DateTime.UtcNow.AddDays(1).ToString("O"),
            Telefone = "11999999999",
            Email = "e@t.com",
            QtdPessoas = 10,
            ImagemURL = "evento.jpg"
        });
        denied.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);

        client.DefaultRequestHeaders.Authorization = null;
        var adminAuth = await AuthTestHelper.LoginAsAdminAsync(client);
        adminAuth.Roles.Should().Contain("User");

        var allowed = await client.PostAsJsonAsync("/eventos", new EventoDto
        {
            Tema = "Allowed Summit",
            Local = "SP",
            DataEvento = DateTime.UtcNow.AddDays(1).ToString("O"),
            Telefone = "11999999999",
            Email = "e@t.com",
            QtdPessoas = 10,
            ImagemURL = "evento.jpg"
        });
        allowed.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
