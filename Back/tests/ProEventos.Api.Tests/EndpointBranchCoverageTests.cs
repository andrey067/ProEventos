using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;
using Xunit;

namespace ProEventos.Api.Tests;

public class EndpointBranchCoverageTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    [Fact]
    public async Task Lotes_Get_And_Save_Use_Empty_List_When_Service_Returns_Null()
    {
        using var factory = new CustomWebApplicationFactory(configureTestServices: services =>
        {
            services.RemoveAll<ILotesService>();
            services.AddSingleton<ILotesService, NullListLotesService>();
        });
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);

        var get = await client.GetAsync("/lotes/1");
        get.StatusCode.Should().Be(HttpStatusCode.OK);
        (await get.Content.ReadFromJsonAsync<List<LoteDto>>(JsonOptions)).Should().BeEmpty();

        var save = await client.PutAsJsonAsync("/lotes/1", new List<LoteDto>());
        save.StatusCode.Should().Be(HttpStatusCode.OK);
        (await save.Content.ReadFromJsonAsync<List<LoteDto>>(JsonOptions)).Should().BeEmpty();
    }

    [Fact]
    public async Task Palestrantes_Post_Handles_Null_Body_And_Explicit_UserId()
    {
        using var factory = new CustomWebApplicationFactory();
        var client = factory.CreateClient();
        await AuthTestHelper.AuthenticateAsync(client);

        var nullBody = new StringContent("null", Encoding.UTF8, "application/json");
        (await client.PostAsync("/palestrantes", nullBody)).StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await AuthTestHelper.RegisterPalestranteAsync(client, suffix: Guid.NewGuid().ToString("N")[..8]);
        await AuthTestHelper.AuthenticateAsync(client);

        var withUserId = await client.PostAsJsonAsync("/palestrantes", new PalestranteDto
        {
            Nome = "Linked Speaker",
            Email = "linked@test.com",
            UserId = "explicit-user-id"
        });
        withUserId.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Account_Profile_Resolves_UserId_From_Sub_Claim()
    {
        using var factory = new CustomWebApplicationFactory(configureTestServices: services =>
        {
            services.AddAuthentication(SubOnlyAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, SubOnlyAuthHandler>(SubOnlyAuthHandler.SchemeName, null);
            services.AddAuthorization(options =>
            {
                options.DefaultPolicy = new AuthorizationPolicyBuilder(SubOnlyAuthHandler.SchemeName)
                    .RequireAuthenticatedUser()
                    .Build();
            });
        });
        var client = factory.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..8];
        var register = await client.PostAsJsonAsync("/account/register", new UserRegisterDto
        {
            Nome = "Sub User",
            UserName = $"sub_{suffix}",
            Email = $"sub_{suffix}@test.com",
            Password = "Senha@123"
        });
        register.EnsureSuccessStatusCode();

        await using var scope = factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider
            .GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<ProEventos.Domain.Entities.User>>();
        var user = await userManager.FindByNameAsync($"sub_{suffix}");
        SubOnlyAuthHandler.UserId = user!.Id;

        var profile = await client.GetAsync("/account/profile");
        profile.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private sealed class NullListLotesService : ILotesService
    {
        public Task<ErrorOr<Success>> AddLote(int eventoId, LoteDto model) =>
            Task.FromResult<ErrorOr<Success>>(Result.Success);

        public Task<ErrorOr<List<LoteDto>>> SaveLotes(int eventoId, List<LoteDto> models, string userId) =>
            Task.FromResult<ErrorOr<List<LoteDto>>>((List<LoteDto>)null);

        public Task<ErrorOr<Success>> DeleteLote(int eventoId, int loteId, string userId) =>
            Task.FromResult<ErrorOr<Success>>(Result.Success);

        public Task<ErrorOr<List<LoteDto>>> GetLotesByEventoIdAsync(int eventoId) =>
            Task.FromResult<ErrorOr<List<LoteDto>>>((List<LoteDto>)null);

        public Task<ErrorOr<LoteDto>> GetLoteByIdsAsync(int eventoId, int loteId) =>
            Task.FromResult<ErrorOr<LoteDto>>(Error.NotFound("Lote.Get.NotFound", "Lote não encontrado."));
    }

    private sealed class SubOnlyAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "SubOnly";

        public static string UserId { get; set; }

        public SubOnlyAuthHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            System.Text.Encodings.Web.UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (string.IsNullOrWhiteSpace(UserId))
                return Task.FromResult(AuthenticateResult.Fail("Missing test user id"));

            var identity = new ClaimsIdentity(new[] { new Claim("sub", UserId) }, SchemeName);
            var principal = new ClaimsPrincipal(identity);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
        }
    }
}
