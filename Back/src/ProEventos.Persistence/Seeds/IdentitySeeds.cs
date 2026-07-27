using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Identity;

namespace ProEventos.Persistence.Seeds
{
    public static class IdentitySeeds
    {
        public const string AdminUserName = "admin";
        public const string AdminPassword = "senha123";
        public const string AdminEmail = "admin@proeventos.local";

        public const string PalestranteUserName = "palestrante";
        public const string PalestrantePassword = "senha123";
        public const string PalestranteEmail = "palestrante@proeventos.local";

        public static async Task EnsureRolesAndUsersAsync(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            DataContext context)
        {
            await EnsureRoleAsync(roleManager, AppRoles.User);
            await EnsureRoleAsync(roleManager, AppRoles.Palestrante);

            await EnsureAdminAsync(userManager);
            await EnsurePalestranteAsync(userManager, context);
        }

        public static async Task EnsureAdminAsync(UserManager<User> userManager)
        {
            var admin = await userManager.FindByNameAsync(AdminUserName);
            if (admin == null)
            {
                admin = new User
                {
                    UserName = AdminUserName,
                    Email = AdminEmail,
                    Nome = "Administrador",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(admin, AdminPassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Falha ao criar usuário admin: {errors}");
                }
            }

            if (!await userManager.IsInRoleAsync(admin, AppRoles.User))
                await userManager.AddToRoleAsync(admin, AppRoles.User);
        }

        public static async Task EnsurePalestranteAsync(UserManager<User> userManager, DataContext context)
        {
            var user = await userManager.FindByNameAsync(PalestranteUserName);
            if (user == null)
            {
                user = new User
                {
                    UserName = PalestranteUserName,
                    Email = PalestranteEmail,
                    Nome = "Palestrante Demo",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, PalestrantePassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Falha ao criar usuário palestrante: {errors}");
                }
            }

            if (!await userManager.IsInRoleAsync(user, AppRoles.Palestrante))
                await userManager.AddToRoleAsync(user, AppRoles.Palestrante);

            var linked = await context.Palestrantes.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (linked == null)
            {
                context.Palestrantes.Add(new Palestrante
                {
                    Nome = user.Nome,
                    Email = user.Email,
                    MiniCurriculo = "Palestrante de demonstração (ReadOnly)",
                    UserId = user.Id
                });
                await context.SaveChangesAsync();
            }
        }

        private static async Task EnsureRoleAsync(RoleManager<IdentityRole> roleManager, string roleName)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }
}
