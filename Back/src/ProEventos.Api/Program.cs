using dotenv.net;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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

builder.Services
    .AddOptions<CorsOptions>()
    .Bind(builder.Configuration.GetSection(CorsOptions.SectionName))
    .ValidateDataAnnotations()
    .Validate(o => o.GetOrigins().Length > 0, "Cors:Origins must list at least one origin.")
    .ValidateOnStart();

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ProEventos.Api.Exceptions.AppExceptionHandler>();

ConfigureRepository.ConfigureDependenciesRepository(builder.Services, builder.Configuration);
ConfigureService.ConfigureDependenciesServices(builder.Services, builder.Configuration);

var corsOrigins = builder.Configuration
    .GetSection(CorsOptions.SectionName)
    .Get<CorsOptions>()
    ?.GetOrigins()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontends", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options
            .WithTitle("ProEventos API")
            .WithTheme(ScalarTheme.Kepler);
    });
}

app.UseCors("Frontends");
app.UseAuthConfiguration();

app.MapAccountEndpoints();
app.MapEventoEndpoints();
app.MapLoteEndpoints();
app.MapPalestranteEndpoints();
app.MapRedeSocialEndpoints();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<DataContext>();

    var providerName = context.Database.ProviderName ?? string.Empty;
    if (providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        context.Database.Migrate();
    else
        context.Database.EnsureCreated();

    var needsSeed = !context.Eventos.Any();
    if (!needsSeed && app.Environment.IsDevelopment())
    {
        var count = context.Eventos.Count();
        var hasHttpsImage = context.Eventos.Any(e =>
            e.ImagemURL != null &&
            EF.Functions.Like(e.ImagemURL, "https://%"));
        needsSeed = count < EventoSeeds.MinEventoCount || !hasHttpsImage;
        if (needsSeed)
        {
            context.Lotes.RemoveRange(context.Lotes);
            context.Eventos.RemoveRange(context.Eventos);
            context.SaveChanges();
        }
    }

    if (needsSeed)
        EventoSeeds.Eventos(context);

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    IdentitySeeds.EnsureRolesAndUsersAsync(userManager, roleManager, context).GetAwaiter().GetResult();
}

app.Run();

public partial class Program { }
