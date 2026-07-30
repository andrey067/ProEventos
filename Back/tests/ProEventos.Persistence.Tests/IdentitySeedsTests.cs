using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Enum;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Identity;
using ProEventos.Persistence.Seeds;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class IdentitySeedsTests
{
    [Fact]
    public async Task EnsureRolesAndUsersAsync_Creates_Admin_Palestrante_And_Demo_Speakers()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            EventoSeeds.Eventos(ctx);

            await IdentitySeeds.EnsureRolesAndUsersAsync(userManager, roleManager, ctx);

            (await roleManager.RoleExistsAsync(AppRoles.User)).Should().BeTrue();
            (await roleManager.RoleExistsAsync(AppRoles.Palestrante)).Should().BeTrue();

            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            admin.Should().NotBeNull();
            admin!.PrimeiroNome.Should().Be("Maria");
            admin.ImagemURL.Should().StartWith("https://");
            (await userManager.IsInRoleAsync(admin, AppRoles.User)).Should().BeTrue();

            var palestranteUser = await userManager.FindByNameAsync(IdentitySeeds.PalestranteUserName);
            palestranteUser.Should().NotBeNull();
            (await userManager.IsInRoleAsync(palestranteUser!, AppRoles.Palestrante)).Should().BeTrue();

            var linked = await ctx.Palestrantes.FirstOrDefaultAsync(p => p.UserId == palestranteUser!.Id);
            linked.Should().NotBeNull();
            (await ctx.PalestranteEvento.CountAsync(pe => pe.PalestranteId == linked!.Id)).Should().BeGreaterThan(0);

            (await ctx.Palestrantes.CountAsync()).Should().BeGreaterThanOrEqualTo(11);
        }
    }

    [Fact]
    public async Task EnsureAdminAsync_Updates_Existing_User_Profile()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            await IdentitySeeds.EnsureAdminAsync(userManager);

            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            admin!.PrimeiroNome = null;
            admin.UltimoNome = null;
            admin.Telefone = null;
            admin.Descricao = null;
            admin.ImagemURL = null;
            await userManager.UpdateAsync(admin);

            await IdentitySeeds.EnsureAdminAsync(userManager);

            var updated = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            updated!.PrimeiroNome.Should().Be("Maria");
            updated.UltimoNome.Should().Be("Administradora");
            updated.Telefone.Should().NotBeNullOrWhiteSpace();
            updated.Descricao.Should().NotBeNullOrWhiteSpace();
            updated.ImagemURL.Should().NotBeNullOrWhiteSpace();
            (await userManager.IsInRoleAsync(updated, AppRoles.User)).Should().BeTrue();
        }
    }

    [Fact]
    public async Task EnsurePalestranteAsync_Links_Existing_User_And_Eventos()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            EventoSeeds.Eventos(ctx);
            await IdentitySeeds.EnsurePalestranteAsync(userManager, ctx);
            await IdentitySeeds.EnsurePalestranteAsync(userManager, ctx);

            var user = await userManager.FindByNameAsync(IdentitySeeds.PalestranteUserName);
            var count = await ctx.Palestrantes.CountAsync(p => p.UserId == user!.Id);
            count.Should().Be(1);
        }
    }

    [Fact]
    public async Task EnsureDemoPalestrantesAsync_Skips_When_Target_Reached()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            await IdentitySeeds.EnsureDemoPalestrantesAsync(userManager, ctx);
            var firstCount = await ctx.Palestrantes.CountAsync();

            await IdentitySeeds.EnsureDemoPalestrantesAsync(userManager, ctx);
            (await ctx.Palestrantes.CountAsync()).Should().Be(firstCount);
            firstCount.Should().BeGreaterThanOrEqualTo(11);
        }
    }

    [Fact]
    public async Task EnsureRolesAndUsersAsync_Is_Idempotent()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            EventoSeeds.Eventos(ctx);
            await IdentitySeeds.EnsureRolesAndUsersAsync(userManager, roleManager, ctx);
            var countAfterFirst = await ctx.Palestrantes.CountAsync();

            await IdentitySeeds.EnsureRolesAndUsersAsync(userManager, roleManager, ctx);

            (await ctx.Palestrantes.CountAsync()).Should().Be(countAfterFirst);
            (await userManager.FindByNameAsync(IdentitySeeds.AdminUserName)).Should().NotBeNull();
        }
    }

    [Fact]
    public async Task EnsureAdminAsync_Preserves_Existing_Profile_Fields()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            await IdentitySeeds.EnsureAdminAsync(userManager);
            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            admin!.PrimeiroNome = "Custom";
            admin.UltimoNome = "Name";
            admin.Titulo = Titulo.Doutorado;
            admin.Funcao = Funcao.Palestrante;
            admin.Telefone = "11000000000";
            admin.Descricao = "Custom bio";
            admin.ImagemURL = "https://custom.img";
            await userManager.UpdateAsync(admin);

            await IdentitySeeds.EnsureAdminAsync(userManager);

            var updated = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            updated!.PrimeiroNome.Should().Be("Custom");
            updated.UltimoNome.Should().Be("Name");
            updated.Titulo.Should().Be(Titulo.Doutorado);
            updated.Funcao.Should().Be(Funcao.Palestrante);
            updated.Telefone.Should().Be("11000000000");
            updated.Descricao.Should().Be("Custom bio");
            updated.ImagemURL.Should().Be("https://custom.img");
        }
    }

    [Fact]
    public async Task EnsureAdminAsync_Fills_Only_Missing_Profile_Parts()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            await IdentitySeeds.EnsureAdminAsync(userManager);
            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            admin!.PrimeiroNome = "KeepFirst";
            admin.UltimoNome = null;
            admin.Telefone = null;
            await userManager.UpdateAsync(admin);

            await IdentitySeeds.EnsureAdminAsync(userManager);

            var updated = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            updated!.PrimeiroNome.Should().Be("KeepFirst");
            updated.UltimoNome.Should().Be("Administradora");
            updated.Nome.Should().Be("KeepFirst Administradora");
            updated.Telefone.Should().NotBeNullOrWhiteSpace();
        }
    }

    [Fact]
    public async Task EnsureDemoPalestrantesAsync_Skips_When_Palestrante_Already_Linked()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            var existing = new User
            {
                UserName = "speaker01",
                Email = "speaker01@proeventos.local",
                EmailConfirmed = true
            };
            (await userManager.CreateAsync(existing, IdentitySeeds.PalestrantePassword)).Succeeded.Should().BeTrue();
            ctx.Palestrantes.Add(new Palestrante
            {
                Nome = "Speaker 1",
                Email = existing.Email,
                UserId = existing.Id
            });
            await ctx.SaveChangesAsync();

            await IdentitySeeds.EnsureDemoPalestrantesAsync(userManager, ctx);

            (await ctx.Palestrantes.CountAsync(p => p.UserId == existing.Id)).Should().Be(1);
        }
    }

    [Fact]
    public async Task EnsureDemoPalestrantesAsync_Reuses_Existing_Speaker_Users()
    {
        var (ctx, userManager, roleManager) = IdentityTestHelper.Create();
        using (ctx)
        {
            var existing = new User
            {
                UserName = "speaker01",
                Email = "speaker01@proeventos.local",
                EmailConfirmed = true
            };
            (await userManager.CreateAsync(existing, IdentitySeeds.PalestrantePassword)).Succeeded.Should().BeTrue();

            await IdentitySeeds.EnsureDemoPalestrantesAsync(userManager, ctx);

            (await ctx.Palestrantes.AnyAsync(p => p.UserId == existing.Id)).Should().BeTrue();
            (await userManager.IsInRoleAsync(existing, AppRoles.Palestrante)).Should().BeTrue();
        }
    }
}
