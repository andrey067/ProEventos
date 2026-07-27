using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class RedeSocialMapping : IEntityTypeConfiguration<RedeSocial>
    {
        public void Configure(EntityTypeBuilder<RedeSocial> builder)
        {
            builder.ToTable("RedeSociais");

            builder.HasOne(rs => rs.Evento)
                .WithMany(e => e.RedeSociais)
                .HasForeignKey(rs => rs.EventoId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(rs => rs.Palestrante)
                .WithMany(p => p.RedeSociais)
                .HasForeignKey(rs => rs.PalestranteId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
