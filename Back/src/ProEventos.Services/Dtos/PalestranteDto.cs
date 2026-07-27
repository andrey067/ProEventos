using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ProEventos.Services.Dtos
{
    public class PalestranteDto
    {
        public int Id { get; set; }

        [Required]
        public string Nome { get; set; }

        [Required]
        public string UserId { get; set; }

        public string MiniCurriculo { get; set; }
        public string ImagemURL { get; set; }
        public string Telefone { get; set; }
        public string Email { get; set; }
        public IEnumerable<RedeSocialDto> RedesSociais { get; set; }
        public IEnumerable<EventoDto> Eventos { get; set; }
    }
}
