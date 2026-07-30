using FluentAssertions;
using ProEventos.Services.Helpers;
using Xunit;

namespace ProEventos.Services.Tests;

public class SearchTermResolverTests
{
    [Theory]
    [InlineData("  hello ", null, "hello")]
    [InlineData(null, "tema", "tema")]
    [InlineData("  ", "tema", "tema")]
    [InlineData(null, null, null)]
    [InlineData("", "  ", null)]
    public void ResolveEventoTerm_Prefers_Q_Then_Tema(string q, string tema, string expected)
    {
        SearchTermResolver.ResolveEventoTerm(q, tema).Should().Be(expected);
    }

    [Theory]
    [InlineData("q", "n", "t", "q")]
    [InlineData(null, "nome", "tema", "nome")]
    [InlineData("  ", null, "tema", "tema")]
    [InlineData(null, null, null, null)]
    [InlineData("", "  ", "  ", null)]
    public void ResolvePalestranteTerm_Prefers_Q_Then_Nome_Then_Tema(
        string q, string nome, string tema, string expected)
    {
        SearchTermResolver.ResolvePalestranteTerm(q, nome, tema).Should().Be(expected);
    }
}
