using System.Text.Json;
using System.Text.Json.Serialization;
using dotenv.net;
using Microsoft.AspNetCore.Identity;
using ProEventos.Api.Endpoints;
using ProEventos.Api.Options;
using ProEventos.CrossCutting.DependencyInjection;
using ProEventos.Domain.Entities;
using ProEventos.Persistence;
using ProEventos.Persistence.Seeds;
using Scalar.AspNetCore;

DotEnv.Load(options: new DotEnvOptions(
    probeForEnv: true,
    probeLevelsToSearch: 6,
    ignoreExceptions: true));

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services
    .AddOptions<CorsOptions>()
    .Bind(builder.Configuration.GetSection(CorsOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(o => o.GetOrigins().Length > 0, "Cors:Origins must list at least one origin.")
    .ValidateOnStart();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "ProEventos API";
        document.Info.Description = "API for the ProEventos project";
        return Task.CompletedTask;
    });
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ProEventos.Api.Exceptions.AppExceptionHandler>();

ConfigureRepository.ConfigureDependenciesRepository(builder.Services, builder.Configuration);
ConfigureService.ConfigureDependenciesServices(builder.Services, builder.Configuration);

builder.Services.AddCors();

var app = builder.Build();

var corsOrigins = app.Services
    .GetRequiredService<Microsoft.Extensions.Options.IOptions<CorsOptions>>()
    .Value
    .GetOrigins();

app.UseExceptionHandler();
app.UseCors(policy =>
    policy.WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithExposedHeaders(ProEventos.Api.Extensions.PaginationHeaderExtensions.HeaderName));
app.UseAuthConfiguration();

app.MapOpenApi();
app.MapScalarApiReference("/docs", options =>
{
    options
        .WithTitle("ProEventos API")
        .AddPreferredSecuritySchemes(["Bearer"])
        .AddHttpAuthentication("Bearer", scheme =>
        {
            scheme.Description =
                "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"";
        })
        .HideSearch()
        .HideTestRequestButton()
        .HideDocumentDownload()
        .HideDeveloperTools()
        .WithTheme(ScalarTheme.Kepler);
});

app.MapAccountEndpoints();
app.MapEventoEndpoints();
app.MapLoteEndpoints();
app.MapPalestranteEndpoints();
app.MapRedeSocialEndpoints();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DataContext>();
    DatabaseInitializer.Initialize(context);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    IdentitySeeds.EnsureRolesAndUsersAsync(userManager, roleManager, context).GetAwaiter().GetResult();
    EventoSeeds.AssignOwnerToOrphans(context, userManager).GetAwaiter().GetResult();
}

app.Run();

public partial class Program { }
