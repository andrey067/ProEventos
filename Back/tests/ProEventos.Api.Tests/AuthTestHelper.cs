using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ProEventos.Persistence.Seeds;
using ProEventos.Services.Dtos;

namespace ProEventos.Api.Tests;

public static class AuthTestHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static async Task AuthenticateAsync(HttpClient client, string suffix = null)
    {
        suffix ??= Guid.NewGuid().ToString("N")[..8];
        var register = new UserRegisterDto
        {
            Nome = "Test User",
            UserName = $"user_{suffix}",
            Email = $"user_{suffix}@test.com",
            Password = "Senha@123"
        };

        var response = await client.PostAsJsonAsync("/account/register", register);
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }

    public static async Task<AuthResponseDto> LoginAsAdminAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/account/login", new UserLoginDto
        {
            UserName = IdentitySeeds.AdminUserName,
            Password = IdentitySeeds.AdminPassword
        });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        if (string.IsNullOrWhiteSpace(auth?.Token))
            throw new InvalidOperationException("Admin login succeeded but returned an empty access token.");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return auth;
    }

    public static async Task<AuthResponseDto> LoginAsPalestranteAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/account/login", new UserLoginDto
        {
            UserName = IdentitySeeds.PalestranteUserName,
            Password = IdentitySeeds.PalestrantePassword
        });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return auth;
    }

    public static async Task<AuthResponseDto> RegisterPalestranteAsync(HttpClient client, string suffix = null)
    {
        suffix ??= Guid.NewGuid().ToString("N")[..8];
        var response = await client.PostAsJsonAsync("/account/register-palestrante", new UserRegisterPalestranteDto
        {
            Nome = "Speaker",
            UserName = $"pal_{suffix}",
            Email = $"pal_{suffix}@test.com",
            Password = "Senha@123",
            MiniCurriculo = "Bio"
        });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
    }
}
