using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class PalestranteEventoMapping : IEntityTypeConfiguration<Palestrante_Evento>
    {
        public void Configure(EntityTypeBuilder<Palestrante_Evento> builder)
        {
            builder.ToTable("PalestranteEvento");

            builder.HasKey(pe => new { pe.EventoId, pe.PalestranteId });

            builder.HasOne(pe => pe.Evento)
                .WithMany(e => e.PalestrantesEventos)
                .HasForeignKey(pe => pe.EventoId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            builder.HasOne(pe => pe.Palestrante)
                .WithMany(p => p.PalestrantesEventos)
                .HasForeignKey(pe => pe.PalestranteId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        }
    }
}
