using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Persistence;
using ProEventos.Persistence.Seeds;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class DatabaseInitializerTests
{
    [Fact]
    public void Initialize_On_InMemory_Clears_And_Seeds_Eventos()
    {
        using var ctx = DataContextFactory.Create();
        ctx.Eventos.Add(new Evento
        {
            Tema = "Old",
            Telefone = "11",
            Email = "old@test.com",
            QtdPessoas = 1,
            ImagemURL = "old.jpg"
        });
        ctx.SaveChanges();
        ctx.Eventos.Should().HaveCount(1);

        DatabaseInitializer.Initialize(ctx);

        ctx.Eventos.Should().HaveCountGreaterThanOrEqualTo(EventoSeeds.MinEventoCount);
        ctx.Lotes.Should().NotBeEmpty();
    }

    [Fact]
    public void EnsureSchema_On_InMemory_Calls_EnsureCreated()
    {
        using var ctx = DataContextFactory.Create();
        DatabaseInitializer.EnsureSchema(ctx);
        ctx.Database.CanConnect().Should().BeTrue();
    }

    [Fact]
    public void ClearAllData_Removes_All_Rows()
    {
        using var ctx = DataContextFactory.Create();
        EventoSeeds.Eventos(ctx);
        ctx.Users.Add(new User
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "u",
            NormalizedUserName = "U",
            Email = "u@t.com",
            NormalizedEmail = "U@T.COM",
            SecurityStamp = Guid.NewGuid().ToString()
        });
        ctx.SaveChanges();

        ctx.Eventos.Should().NotBeEmpty();
        ctx.Users.Should().NotBeEmpty();

        DatabaseInitializer.ClearAllData(ctx);

        ctx.Eventos.Should().BeEmpty();
        ctx.Lotes.Should().BeEmpty();
        ctx.Palestrantes.Should().BeEmpty();
        ctx.RedeSociais.Should().BeEmpty();
        ctx.PalestranteEvento.Should().BeEmpty();
        ctx.Users.Should().BeEmpty();
    }

    [Fact]
    public void TableExists_Returns_True_After_Migrate()
    {
        var (ctx, connection) = DataContextFactory.CreateSqlite();
        using (connection)
        using (ctx)
        {
            ctx.Database.Migrate();
            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
            DatabaseInitializer.TableExists(ctx, "MissingTable").Should().BeFalse();
        }
    }

    [Fact]
    public void EnsureSchema_On_Sqlite_Migrates_When_Tables_Missing()
    {
        var (ctx, connection) = DataContextFactory.CreateSqlite();
        using (connection)
        using (ctx)
        {
            DatabaseInitializer.EnsureSchema(ctx);
            ctx.Eventos.Should().NotBeNull();
            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
        }
    }

    [Fact]
    public void EnsureSchema_On_Sqlite_Recreates_When_Schema_Is_Stale()
    {
        var (ctx, connection) = DataContextFactory.CreateSqlite();
        using (connection)
        using (ctx)
        {
            ctx.Database.EnsureCreated();
            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
            ctx.Database.GetPendingMigrations().Should().NotBeEmpty();

            DatabaseInitializer.EnsureSchema(ctx);

            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
            ctx.Database.GetPendingMigrations().Should().BeEmpty();
        }
    }

    [Fact]
    public void EnsureSchema_On_Sqlite_Is_NoOp_When_Schema_Current()
    {
        var (ctx, connection) = DataContextFactory.CreateSqlite();
        using (connection)
        using (ctx)
        {
            ctx.Database.Migrate();
            ctx.Eventos.Add(new Evento
            {
                Tema = "Keep",
                Telefone = "11",
                Email = "a@b.com",
                QtdPessoas = 1,
                ImagemURL = "i.jpg"
            });
            ctx.SaveChanges();

            DatabaseInitializer.EnsureSchema(ctx);

            ctx.Eventos.Should().ContainSingle(e => e.Tema == "Keep");
        }
    }

    [Fact]
    public void TableExists_Opens_And_Closes_Connection_When_Closed()
    {
        var path = Path.Combine(Path.GetTempPath(), $"pe-test-{Guid.NewGuid():N}.db");
        var connection = new SqliteConnection($"Data Source={path}");
        try
        {
            var options = new DbContextOptionsBuilder<DataContext>()
                .UseSqlite(connection)
                .Options;
            using var ctx = new DataContext(options);
            ctx.Database.Migrate();
            connection.Close();
            connection.State.Should().Be(System.Data.ConnectionState.Closed);

            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
            connection.State.Should().Be(System.Data.ConnectionState.Closed);
        }
        finally
        {
            connection.Dispose();
            if (File.Exists(path))
                File.Delete(path);
        }
    }

    [Fact]
    public void TableExists_Works_When_Connection_Already_Open()
    {
        var (ctx, connection) = DataContextFactory.CreateSqlite();
        using (connection)
        using (ctx)
        {
            ctx.Database.Migrate();
            ctx.Database.GetDbConnection().State.Should().Be(System.Data.ConnectionState.Open);

            DatabaseInitializer.TableExists(ctx, "Eventos").Should().BeTrue();
            DatabaseInitializer.TableExists(ctx, "NoSuchTable").Should().BeFalse();
        }
    }
}
