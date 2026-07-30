using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProEventos.Domain.Entities;

namespace ProEventos.Persistence.Mappings
{
    public class UserMapping : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.Property(u => u.Nome).HasMaxLength(256);
            builder.Property(u => u.PrimeiroNome).HasMaxLength(50);
            builder.Property(u => u.UltimoNome).HasMaxLength(50);
            builder.Property(u => u.Telefone).HasMaxLength(20);
            builder.Property(u => u.Descricao).HasMaxLength(500);
            builder.Property(u => u.ImagemURL).HasMaxLength(500);
            builder.Property(u => u.Titulo).HasConversion<string>().HasMaxLength(32);
            builder.Property(u => u.Funcao).HasConversion<string>().HasMaxLength(32);
        }
    }
}
