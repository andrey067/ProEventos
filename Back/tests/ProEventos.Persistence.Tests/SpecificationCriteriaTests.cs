using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Specifications;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class SpecificationCriteriaTests
{
    [Fact]
    public void EventoGlobalSearchSpecification_Rejects_Blank()
    {
        var act = () => new EventoGlobalSearchSpecification("  ");
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void EventoGlobalSearchSpecification_Handles_Null_Fields()
    {
        var spec = new EventoGlobalSearchSpecification("x");
        var compiled = spec.Criteria.Compile();
        compiled(new Evento()).Should().BeFalse();
        compiled(new Evento { Tema = "axb" }).Should().BeTrue();
        compiled(new Evento { Local = "axb" }).Should().BeTrue();
        compiled(new Evento { Email = "axb" }).Should().BeTrue();
        compiled(new Evento { Telefone = "axb" }).Should().BeTrue();
    }

    [Fact]
    public void PalestranteGlobalSearchSpecification_Handles_Null_Navigations()
    {
        var spec = new PalestranteGlobalSearchSpecification("x");
        var compiled = spec.Criteria.Compile();
        compiled(new Palestrante()).Should().BeFalse();
        compiled(new Palestrante { Nome = "axb" }).Should().BeTrue();
        compiled(new Palestrante { MiniCurriculo = "axb" }).Should().BeTrue();
        compiled(new Palestrante { Email = "axb" }).Should().BeTrue();
        compiled(new Palestrante { Telefone = "axb" }).Should().BeTrue();
        compiled(new Palestrante
        {
            PalestrantesEventos = new List<Palestrante_Evento>
            {
                new() { Evento = new Evento { Tema = "axb" } }
            }
        }).Should().BeTrue();
        compiled(new Palestrante
        {
            PalestrantesEventos = new List<Palestrante_Evento> { new() { Evento = null } }
        }).Should().BeFalse();
    }
}
