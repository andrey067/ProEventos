using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Services.Tests;

public class LoteDtoTests
{
    [Fact]
    public void Validate_Rejects_End_Before_Start()
    {
        var dto = new LoteDto
        {
            Nome = "VIP",
            Preco = 10,
            Quantidade = 5,
            DataIncio = DateTime.UtcNow.AddDays(2),
            DataFim = DateTime.UtcNow
        };

        var results = new List<ValidationResult>();
        Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
        dto.Validate(new ValidationContext(dto)).Should().ContainSingle(r =>
            r.ErrorMessage!.Contains("Data inicial"));
    }

    [Fact]
    public void Validate_Accepts_Valid_Range()
    {
        var dto = new LoteDto
        {
            Nome = "VIP",
            Preco = 10,
            Quantidade = 5,
            DataIncio = DateTime.UtcNow,
            DataFim = DateTime.UtcNow.AddDays(1)
        };

        dto.Validate(new ValidationContext(dto)).Should().BeEmpty();
    }
}
