using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace ProEventos.Services.Dtos
{
    public class LoteDto : IValidatableObject
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O campo {0} é obrigatório.")]
        public string Nome { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Preço deve ser maior que zero.")]
        public decimal Preco { get; set; }

        [Required]
        public System.DateTime DataIncio { get; set; }

        [Required]
        public System.DateTime DataFim { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Quantidade deve ser maior que zero.")]
        public int Quantidade { get; set; }

        public int EventoId { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DataIncio > DataFim)
            {
                yield return new ValidationResult(
                    "Data inicial não pode ser posterior à data final.",
                    new[] { nameof(DataIncio), nameof(DataFim) });
            }
        }
    }
}
