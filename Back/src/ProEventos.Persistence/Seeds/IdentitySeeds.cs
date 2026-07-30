using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Enum;
using ProEventos.Domain.Identity;
using ProEventos.Domain.Helpers;

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
            await EnsureDemoPalestrantesAsync(userManager, context);
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
                    PrimeiroNome = "Maria",
                    UltimoNome = "Administradora",
                    Nome = "Maria Administradora",
                    Titulo = Titulo.Especialista,
                    Funcao = Funcao.Participante,
                    Telefone = "11999990001",
                    Descricao = "Organizadora de eventos ProEventos (conta demo).",
                    ImagemURL = UnsplashPortraitPicker.At(0),
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(admin, AdminPassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Falha ao criar usuário admin: {errors}");
                }
            }
            else
            {
                ApplyProfileIfMissing(admin, "Maria", "Administradora", Titulo.Especialista, Funcao.Participante,
                    "11999990001", "Organizadora de eventos ProEventos (conta demo).", UnsplashPortraitPicker.At(0));
                await userManager.UpdateAsync(admin);
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
                    PrimeiroNome = "Lee",
                    UltimoNome = "Cross",
                    Nome = "Lee Cross",
                    Titulo = Titulo.Bacharel,
                    Funcao = Funcao.Palestrante,
                    Telefone = "11999990002",
                    Descricao = "Developer of web applications, JavaScript, .NET, Node.js, etc.",
                    ImagemURL = UnsplashPortraitPicker.At(1),
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(user, PalestrantePassword);
                if (!result.Succeeded)
                {
                    var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Falha ao criar usuário palestrante: {errors}");
                }
            }
            else
            {
                ApplyProfileIfMissing(user, "Lee", "Cross", Titulo.Bacharel, Funcao.Palestrante,
                    "11999990002",
                    "Developer of web applications, JavaScript, .NET, Node.js, etc.",
                    UnsplashPortraitPicker.At(1));
                await userManager.UpdateAsync(user);
            }

            if (!await userManager.IsInRoleAsync(user, AppRoles.Palestrante))
                await userManager.AddToRoleAsync(user, AppRoles.Palestrante);

            var linked = await context.Palestrantes.FirstOrDefaultAsync(p => p.UserId == user.Id);
            if (linked == null)
            {
                linked = new Palestrante
                {
                    Nome = user.Nome,
                    Email = user.Email,
                    Telefone = user.Telefone,
                    MiniCurriculo = "Palestrante de demonstração (ReadOnly)",
                    ImagemURL = user.ImagemURL,
                    UserId = user.Id
                };
                context.Palestrantes.Add(linked);
                await context.SaveChangesAsync();
            }

            // Link to first few eventos so Eventos Ministrados > 0 for demos.
            var eventoIds = await context.Eventos.OrderBy(e => e.Id).Select(e => e.Id).Take(3).ToListAsync();
            foreach (var eventoId in eventoIds)
            {
                var exists = await context.PalestranteEvento
                    .AnyAsync(pe => pe.EventoId == eventoId && pe.PalestranteId == linked.Id);
                if (!exists)
                {
                    context.PalestranteEvento.Add(new Palestrante_Evento
                    {
                        EventoId = eventoId,
                        PalestranteId = linked.Id
                    });
                }
            }
            await context.SaveChangesAsync();
        }

        /// <summary>
        /// Ensures ≥11 demo palestrantes so pageSize=10 yields at least 2 pages.
        /// </summary>
        public static async Task EnsureDemoPalestrantesAsync(
            UserManager<User> userManager,
            DataContext context)
        {
            const int targetCount = 11;
            var existing = await context.Palestrantes.CountAsync();
            if (existing >= targetCount)
                return;

            var toCreate = targetCount - existing;
            for (var i = 0; i < toCreate; i++)
            {
                var index = existing + i + 1;
                var userName = $"speaker{index:00}";
                var email = $"speaker{index:00}@proeventos.local";

                var user = await userManager.FindByNameAsync(userName);
                if (user == null)
                {
                    user = new User
                    {
                        UserName = userName,
                        Email = email,
                        PrimeiroNome = $"Speaker",
                        UltimoNome = $"{index}",
                        Nome = $"Speaker {index}",
                        Titulo = Titulo.Bacharel,
                        Funcao = Funcao.Palestrante,
                        Telefone = $"1199999{index:0000}",
                        Descricao = $"Palestrante demo {index}",
                        ImagemURL = UnsplashPortraitPicker.At(index),
                        EmailConfirmed = true
                    };
                    var result = await userManager.CreateAsync(user, PalestrantePassword);
                    if (!result.Succeeded)
                    {
                        var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"Falha ao criar {userName}: {errors}");
                    }
                }

                if (!await userManager.IsInRoleAsync(user, AppRoles.Palestrante))
                    await userManager.AddToRoleAsync(user, AppRoles.Palestrante);

                var linked = await context.Palestrantes.FirstOrDefaultAsync(p => p.UserId == user.Id);
                if (linked == null)
                {
                    context.Palestrantes.Add(new Palestrante
                    {
                        Nome = $"Speaker {index}",
                        Email = email,
                        Telefone = $"1199999{index:0000}",
                        MiniCurriculo = $"Currículo demo do palestrante {index}",
                        ImagemURL = UnsplashPortraitPicker.At(index),
                        UserId = user.Id,
                        CreateAt = DateTime.UtcNow
                    });
                }
            }

            await context.SaveChangesAsync();
        }

        private static void ApplyProfileIfMissing(
            User user,
            string primeiro,
            string ultimo,
            Titulo titulo,
            Funcao funcao,
            string telefone,
            string descricao,
            string imagemUrl)
        {
            if (string.IsNullOrWhiteSpace(user.PrimeiroNome))
                user.PrimeiroNome = primeiro;
            if (string.IsNullOrWhiteSpace(user.UltimoNome))
                user.UltimoNome = ultimo;
            user.Nome = $"{user.PrimeiroNome} {user.UltimoNome}".Trim();
            if (user.Titulo == default)
                user.Titulo = titulo;
            if (user.Funcao == default)
                user.Funcao = funcao;
            if (string.IsNullOrWhiteSpace(user.Telefone))
                user.Telefone = telefone;
            if (string.IsNullOrWhiteSpace(user.Descricao))
                user.Descricao = descricao;
            if (string.IsNullOrWhiteSpace(user.ImagemURL))
                user.ImagemURL = imagemUrl;
        }

        private static async Task EnsureRoleAsync(RoleManager<IdentityRole> roleManager, string roleName)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
                await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }
}
