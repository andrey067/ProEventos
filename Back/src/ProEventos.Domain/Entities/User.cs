using Microsoft.AspNetCore.Identity;
using ProEventos.Domain.Enum;

namespace ProEventos.Domain.Entities
{
    public class User : IdentityUser
    {
        /// <summary>Display name (PrimeiroNome + UltimoNome), kept for JWT/nav compatibility.</summary>
        public string Nome { get; set; }

        public string PrimeiroNome { get; set; }
        public string UltimoNome { get; set; }
        public Titulo Titulo { get; set; }
        public Funcao Funcao { get; set; }

        /// <summary>Profile phone. Distinct from Identity PhoneNumber.</summary>
        public string Telefone { get; set; }

        /// <summary>Short profile bio. Not Palestrante.MiniCurriculo.</summary>
        public string Descricao { get; set; }

        /// <summary>Absolute https portrait URL (Unsplash CDN).</summary>
        public string ImagemURL { get; set; }
    }
}
