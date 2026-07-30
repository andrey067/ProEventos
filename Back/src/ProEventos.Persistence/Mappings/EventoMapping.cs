using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class EventoMapping : IEntityTypeConfiguration<Evento>
    {
        public void Configure(EntityTypeBuilder<Evento> builder)
        {
            builder.ToTable("Eventos");

            builder.Property(e => e.UserId).HasMaxLength(450);
            builder.HasIndex(e => e.UserId);

            builder.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(e => e.Lotes)
                .WithOne(l => l.Evento)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(e => e.RedeSociais)
                .WithOne(rs => rs.Evento)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
