using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NetDevPack.Identity.Jwt;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Identity;
using ProEventos.Interfaces;
using ProEventos.Persistence;
using ProEventos.Services;
using ProEventos.Services.Interfaces;
using ProEventos.Services.Mappings;
using ProEventos.Services.Services;

namespace ProEventos.CrossCutting.DependencyInjection
{
    public class ConfigureService
    {
        public static void ConfigureDependenciesServices(IServiceCollection serviceCollection, IConfiguration configuration = null)
        {
            MapsterConfig.Register();
            serviceCollection.AddTransient<IEventoService, EventoService>();
            serviceCollection.AddTransient<ILotesService, LotesServices>();
            serviceCollection.AddTransient<IPalestranteService, PalestranteService>();
            serviceCollection.AddTransient<IRedeSocialService, RedeSocialService>();
            serviceCollection.AddTransient<IAccountService, AccountService>();
            serviceCollection.AddTransient<ITokenService, TokenService>();

            if (configuration == null) return;

            serviceCollection
                .AddCustomIdentity<User>(options =>
                {
                    // Senha deve conter:
                    // - Pelo menos 1 dígito
                    options.Password.RequireDigit = false;
                    // - Pelo menos 1 letra minúscula
                    options.Password.RequireLowercase = false;
                    // - Pelo menos 1 letra maiúscula
                    options.Password.RequireUppercase = false;
                    // - Pelo menos 1 caractere não alfanumérico
                    options.Password.RequireNonAlphanumeric = false;
                    // - Pelo menos 8 caracteres
                    options.Password.RequiredLength = 8;
                    // - Pelo menos 1 caractere não alfanumérico
                    options.Password.RequireNonAlphanumeric = false;
                    // - Pelo menos 1 caractere não alfanumérico
                    options.User.RequireUniqueEmail = true;
                    // - Email deve ser único
                    options.SignIn.RequireConfirmedEmail = false;
                })
                .AddCustomEntityFrameworkStores<DataContext>()            
                //.AddRoles<IdentityRole>() // Adiciona o sistema de roles
                //.AddRoleManager<RoleManager<IdentityRole>>() // Gerencia as roles
                //.AddSignInManager<SignInManager<User>>() // Gerencia o login
                .AddDefaultTokenProviders(); // Fornece tokens para o sistema                                

            // --- JWT / Identity (NetDevPack) ---
            // Doc mínima: AddJwtConfiguration + AddNetDevPackIdentity + UseAuthConfiguration() no Program.
            // Abaixo há ajustes extras porque esta API:
            //   • emite e valida tokens localmente (login/refresh via IJwtBuilder);
            //   • usa JWKS (RSA) em vez de SecretKey (HMAC) — AppJwtSettings:SecretKey deve ficar vazio;
            //   • protege writes com RequireRole("User"), não CustomAuthorize do sample;
            //   • combina AddCustomIdentity (cookies) com autenticação Bearer.

            // Cache e DataProtection: persistência das chaves RSA gerenciadas pelo NetDevPack.Security.Jwt.
            serviceCollection.AddMemoryCache();
            serviceCollection.AddDataProtection();

            // Lê AppJwtSettings (Audience, Issuer, Expiration, RefreshToken*) e registra AddAuthentication + JwtBearer.
            // Sem SecretKey → modo JWKS; com SecretKey → HMAC (deprecated; quebra ValidateRefreshToken, que só usa JWKS).
            serviceCollection.AddJwtConfiguration(configuration);

            // Registra IJwtBuilder (AccountService) e AddJwksManager (par de chaves RSA para assinar/validar).
            // UseJwtValidation: JwtBearer passa a validar tokens com as mesmas chaves JWKS (handler customizado).
            // Obrigatório aqui para access token + refresh token funcionarem no mesmo key store.
            serviceCollection.AddNetDevPackIdentity<User>().UseJwtValidation();

            // AddIdentity registra esquema de cookie como padrão; esta API é stateless (Bearer).
            // Sem isso, RequireAuthorization() pode autenticar via cookie em vez de JWT.
            serviceCollection.PostConfigure<AuthenticationOptions>(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            });

            // Ajustes finos do JwtBearer além do que AddJwtConfiguration registra por padrão.
            serviceCollection.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                // Dev/local e pod HTTP atrás de ingress: metadata OIDC não precisa ser HTTPS.
                // (Pouco impacto no modo JWKS local; relevante se no futuro validar contra IdP externo.)
                options.RequireHttpsMetadata = false;

                // Evita renomear claims curtas do NetDevPack para URIs longas do Microsoft schema.
                options.MapInboundClaims = false;

                // NetDevPack.WithUserRoles() emite claim "role"; alinha com policy.RequireRole(...) nos endpoints.
                options.TokenValidationParameters.RoleClaimType = "role";

                // NetDevPack.WithJwtClaims() emite "sub" com o user id; usado em /account/profile.
                options.TokenValidationParameters.NameClaimType = "sub";

                // Access token é emitido com typ "at+jwt"; sem isso na allowlist o bearer pode rejeitar o token.
                options.TokenValidationParameters.ValidTypes = new[] { "at+jwt", "JWT", "jwt" };

                // UseJwtValidation substitui TokenHandlers; o handler novo mantém InboundClaimTypeMap ativo por padrão.
                // Limpar o mapa garante que "role" continue "role" e RequireRole("User") não retorne 403.
                foreach (var handler in options.TokenHandlers.OfType<JwtSecurityTokenHandler>())
                {
                    handler.InboundClaimTypeMap.Clear();
                    handler.MapInboundClaims = false;
                }
            });

            // Palestrante = read-only; User = writes (POST/PUT/DELETE de eventos, lotes, etc.).
            serviceCollection.AddAuthorization(options =>
            {
                options.AddPolicy(AppRoles.RequireUserRolePolicy, policy =>
                    policy.RequireRole(AppRoles.User));
            });
        }
    }
}
