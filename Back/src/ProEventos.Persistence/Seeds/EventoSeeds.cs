using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProEventos.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProEventos.Persistence.Seeds
{
    public static class EventoSeeds
    {
        public const int MinEventoCount = 50;
        public const int TargetEventoCount = 60;

        /// <summary>Curated Unsplash CDN thumbs (event-themed). No JWT; CDN GET only.</summary>
        private static readonly string[] UnsplashEventImages =
        {
            "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&fit=max",
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200&fit=max",
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=200&fit=max",
            "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200&fit=max",
            "https://images.unsplash.com/photo-1511578314322-379afb476865?w=200&fit=max",
            "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&fit=max",
            "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=200&fit=max",
            "https://images.unsplash.com/photo-1459749411175-04bf52967745?w=200&fit=max",
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&fit=max",
            "https://images.unsplash.com/photo-1531058020387-3be344406418?w=200&fit=max",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=200&fit=max",
            "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200&fit=max",
        };

        public static void Eventos(DataContext context)
        {
            // Deterministic Bogus seed for reproducible local demos (US4 / T023)
            Randomizer.Seed = new Random(40626);

            var faker = new Faker("pt_BR");
            var eventos = new List<Evento>();
            var lotes = new List<Lote>();

            for (var i = 0; i < TargetEventoCount; i++)
            {
                var tema = faker.Commerce.ProductName();
                if (tema.Length < 3)
                    tema = "Evento " + (i + 1);
                if (tema.Length > 50)
                    tema = tema[..50];

                var evento = new Evento
                {
                    Local = faker.Address.City(),
                    DataEvento = faker.Date.Future(2, DateTime.UtcNow.Date),
                    Tema = tema,
                    QtdPessoas = faker.Random.Int(50, 5000),
                    ImagemURL = faker.PickRandom(UnsplashEventImages),
                    Telefone = "(11) 9" + faker.Random.ReplaceNumbers("####-####"),
                    Email = faker.Internet.Email().ToLowerInvariant(),
                    CreateAt = DateTime.UtcNow,
                    Lotes = new List<Lote>(),
                };
                eventos.Add(evento);
            }

            context.AddRange(eventos);
            context.SaveChanges();

            foreach (var evento in eventos)
            {
                var loteCount = faker.Random.Int(1, 3);
                for (var l = 0; l < loteCount; l++)
                {
                    var inicio = faker.Date.Between(
                        DateTime.UtcNow.Date.AddDays(-30),
                        DateTime.UtcNow.Date.AddDays(60));
                    var fim = inicio.AddDays(faker.Random.Int(0, 45));

                    lotes.Add(new Lote
                    {
                        Nome = faker.PickRandom("Pista", "VIP", "Camarote", "Early Bird", "Meia")
                               + " " + (l + 1),
                        Quantidade = faker.Random.Int(10, 500),
                        DataIncio = inicio,
                        DataFim = fim,
                        Preco = Math.Round(faker.Random.Decimal(20, 800), 2),
                        EventoId = evento.Id,
                    });
                }
            }

            context.AddRange(lotes);
            context.SaveChanges();
        }

        /// <summary>
        /// Backfill UserId on seeded eventos after Identity admin exists.
        /// </summary>
        public static async Task AssignOwnerToOrphans(DataContext context, UserManager<User> userManager)
        {
            var admin = await userManager.FindByNameAsync(IdentitySeeds.AdminUserName);
            if (admin == null)
                return;

            var orphans = await context.Eventos
                .Where(e => e.UserId == null || e.UserId == "")
                .ToListAsync();
            if (orphans.Count == 0)
                return;

            foreach (var evento in orphans)
                evento.UserId = admin.Id;

            await context.SaveChangesAsync();
        }
    }
}
