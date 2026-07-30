using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ProEventos.Persistence;

namespace ProEventos.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName;
    private readonly Action<IServiceCollection> _configureTestServices;

    public CustomWebApplicationFactory(
        string databaseName = null,
        Action<IServiceCollection> configureTestServices = null)
    {
        _databaseName = databaseName ?? $"ProEventosTests_{Guid.NewGuid()}";
        _configureTestServices = configureTestServices;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string>
            {
                ["AppJwtSettings:Audience"] = "ProEventos",
                ["AppJwtSettings:Issuer"] = "ProEventos",
                ["AppJwtSettings:Expiration"] = "12",
                // Empty SecretKey forces JWKS signing; refresh validation always uses JWKS.
                ["AppJwtSettings:SecretKey"] = "",
                ["AppJwtSettings:RefreshTokenExpiration"] = "30",
                ["AppJwtSettings:RefreshTokenType"] = "OneTime",
                ["Cors:Origins"] = "http://localhost:5173,http://localhost:3000,http://localhost:4200",
                ["ConnectionStrings:Default"] = "Data Source=:memory:"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IDbContextOptionsConfiguration<DataContext>>();
            services.RemoveAll<DbContextOptions<DataContext>>();
            services.RemoveAll<DataContext>();

            services.AddDbContext<DataContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            _configureTestServices?.Invoke(services);
        });
    }
}
