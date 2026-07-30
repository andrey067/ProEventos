using System;
using System.Data;
using System.Linq;
using Microsoft.EntityFrameworkCore;

namespace ProEventos.Persistence.Seeds
{
    public static class DatabaseInitializer
    {
        /// <summary>
        /// Ensures schema is ready, then resets data and runs domain + identity seeds.
        /// If tables exist and schema is current: clear rows and seed.
        /// If tables are missing: apply migrations (or EnsureCreated) and seed.
        /// If tables exist but migrations are pending (stale schema): recreate DB, then seed.
        /// </summary>
        public static void Initialize(DataContext context)
        {
            EnsureSchema(context);
            ClearAllData(context);
            EventoSeeds.Eventos(context);
        }

        public static void EnsureSchema(DataContext context)
        {
            var providerName = context.Database.ProviderName ?? string.Empty;
            var isSqlite = providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);

            if (!isSqlite)
            {
                context.Database.EnsureCreated();
                return;
            }

            var tablesExist = TableExists(context, "Eventos");
            var hasPendingMigrations = context.Database.GetPendingMigrations().Any();

            if (tablesExist && hasPendingMigrations)
            {
                context.Database.EnsureDeleted();
                context.Database.Migrate();
                return;
            }

            if (!tablesExist)
                context.Database.Migrate();
        }

        public static void ClearAllData(DataContext context)
        {
            context.RedeSociais.RemoveRange(context.RedeSociais);
            context.PalestranteEvento.RemoveRange(context.PalestranteEvento);
            context.Lotes.RemoveRange(context.Lotes);
            context.Eventos.RemoveRange(context.Eventos);
            context.Palestrantes.RemoveRange(context.Palestrantes);

            context.UserRoles.RemoveRange(context.UserRoles);
            context.UserClaims.RemoveRange(context.UserClaims);
            context.UserLogins.RemoveRange(context.UserLogins);
            context.UserTokens.RemoveRange(context.UserTokens);
            context.RoleClaims.RemoveRange(context.RoleClaims);
            context.Users.RemoveRange(context.Users);
            context.Roles.RemoveRange(context.Roles);

            context.SaveChanges();
        }

        public static bool TableExists(DataContext context, string tableName)
        {
            var connection = context.Database.GetDbConnection();
            var shouldClose = connection.State != ConnectionState.Open;
            if (shouldClose)
                connection.Open();

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText =
                    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = $name LIMIT 1";
                var parameter = command.CreateParameter();
                parameter.ParameterName = "$name";
                parameter.Value = tableName;
                command.Parameters.Add(parameter);
                return command.ExecuteScalar() != null;
            }
            finally
            {
                if (shouldClose)
                    connection.Close();
            }
        }
    }
}
