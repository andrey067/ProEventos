using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Identity;

namespace ProEventos.Persistence.Tests;

internal static class IdentityTestHelper
{
    public static (DataContext Context, UserManager<User> UserManager, RoleManager<IdentityRole> RoleManager) Create()
    {
        var ctx = DataContextFactory.Create();
        ctx.Database.EnsureCreated();

        var identityOptions = Options.Create(new IdentityOptions
        {
            Password =
            {
                RequireDigit = false,
                RequireLowercase = false,
                RequireUppercase = false,
                RequireNonAlphanumeric = false,
                RequiredLength = 6
            }
        });

        var userManager = new UserManager<User>(
            new UserStore<User>(ctx),
            identityOptions,
            new PasswordHasher<User>(),
            new IUserValidator<User>[] { new UserValidator<User>() },
            new IPasswordValidator<User>[] { new PasswordValidator<User>() },
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null,
            NullLogger<UserManager<User>>.Instance);

        var roleManager = new RoleManager<IdentityRole>(
            new RoleStore<IdentityRole>(ctx),
            Array.Empty<IRoleValidator<IdentityRole>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            NullLogger<RoleManager<IdentityRole>>.Instance);

        foreach (var role in new[] { AppRoles.User, AppRoles.Palestrante })
        {
            if (!roleManager.RoleExistsAsync(role).GetAwaiter().GetResult())
                roleManager.CreateAsync(new IdentityRole(role)).GetAwaiter().GetResult();
        }

        return (ctx, userManager, roleManager);
    }
}
