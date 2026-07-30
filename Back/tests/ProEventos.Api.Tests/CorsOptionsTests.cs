using FluentAssertions;
using ProEventos.Api.Options;
using Xunit;

namespace ProEventos.Api.Tests;

public class CorsOptionsTests
{
    [Fact]
    public void GetOrigins_Splits_Comma_Separated_Values()
    {
        var options = new CorsOptions
        {
            Origins = "http://localhost:5173, http://localhost:3000"
        };

        options.GetOrigins().Should().Equal("http://localhost:5173", "http://localhost:3000");
    }

    [Fact]
    public void GetOrigins_Returns_Empty_Array_When_Origins_Is_Null()
    {
        var options = new CorsOptions { Origins = null };

        options.GetOrigins().Should().BeEmpty();
    }
}
