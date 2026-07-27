using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ProEventos.Services.Dtos
{
    public class EventoDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório.")]
        public string Local { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório.")]
        public string DataEvento { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Intervalo permitido de 3 a 50 caracteres.")]
        public string Tema { get; set; }

        [Display(Name = "Qtd Pessoas")]
        [Range(1, 120000, ErrorMessage = "{0} não pode ser menor que 1 e maior que 120.000")]
        public int QtdPessoas { get; set; }

        /// <summary>
        /// Filename with image extension (gif/jpg/jpeg/bmp/png) or absolute https URL (e.g. Unsplash CDN).
        /// </summary>
        [RegularExpression(@"^(https://\S+|.*\.(gif|jpe?g|bmp|png))$",
            ErrorMessage = "Não é uma imagem válida. Use gif/jpg/jpeg/bmp/png ou URL https.")]
        public string ImagemURL { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório")]
        [Phone(ErrorMessage = "O campo {0} está com número inválido")]
        public string Telefone { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório")]
        [Display(Name = "e-mail")]
        [EmailAddress(ErrorMessage = "É necessário ser um {0} válido")]
        public string Email { get; set; }

        public IEnumerable<LoteDto> Lotes { get; set; }
        public IEnumerable<RedeSocialDto> RedesSociais { get; set; }
        public IEnumerable<PalestranteDto> Palestrantes { get; set; }
    }
}
