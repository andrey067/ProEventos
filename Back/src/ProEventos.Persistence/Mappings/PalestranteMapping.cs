using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class PalestranteMapping : IEntityTypeConfiguration<Palestrante>
    {
        public void Configure(EntityTypeBuilder<Palestrante> builder)
        {
            builder.ToTable("Palestrantes");

            builder.Property(p => p.UserId).IsRequired();
            builder.HasIndex(p => p.UserId).IsUnique();

            builder.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.RedeSociais)
                .WithOne(rs => rs.Palestrante)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
