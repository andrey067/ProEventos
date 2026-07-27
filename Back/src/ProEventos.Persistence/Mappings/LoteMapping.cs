using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class LoteMapping : IEntityTypeConfiguration<Lote>
    {
        public void Configure(EntityTypeBuilder<Lote> builder)
        {
            builder.ToTable("Lotes");

            builder.HasOne(l => l.Evento)
                .WithMany(e => e.Lotes)
                .HasForeignKey(l => l.EventoId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        }
    }
}
