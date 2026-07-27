using System.Collections.Generic;
using ProEventos.Domain.Entities;

namespace ProEventos.Domain.Entities
{
    public class Palestrante : BaseEntity
    {
        public string Nome { get; set; }
        public string MiniCurriculo { get; set; }
        public string ImagemURL { get; set; }
        public string Telefone { get; set; }
        public string Email { get; set; }
        public string UserId { get; set; }
        public User User { get; set; }
        public IEnumerable<RedeSocial> RedeSociais { get; set; }
        public IEnumerable<Palestrante_Evento> PalestrantesEventos { get; set; }
    }
}
