using FluentAssertions;
using ProEventos.Services.Dtos;
using ProEventos.Services.Helpers;
using Xunit;

namespace ProEventos.Services.Tests;

public class PaginationHelperTests
{
    [Theory]
    [InlineData(null, null, 1, 10)]
    [InlineData(0, 5, 1, 10)]
    [InlineData(2, 25, 2, 10)]
    [InlineData(1, 20, 1, 20)]
    [InlineData(1, 30, 1, 30)]
    [InlineData(1, 99, 1, 10)]
    public void Normalize_Clamps_Page_And_PageSize(int? page, int? pageSize, int expectedPage, int expectedSize)
    {
        var (p, size) = PaginationHelper.Normalize(page, pageSize);

        p.Should().Be(expectedPage);
        size.Should().Be(expectedSize);
    }

    [Fact]
    public void Build_Returns_Empty_Envelope_When_No_Items()
    {
        var result = PaginationHelper.Build(new List<string>(), 5, 10, 0);

        result.Items.Should().BeEmpty();
        result.Page.Should().Be(PaginationHelper.DefaultPage);
        result.PageSize.Should().Be(10);
        result.TotalCount.Should().Be(0);
        result.TotalPages.Should().Be(0);
    }

    [Fact]
    public void Build_Clamps_Page_When_Beyond_Last()
    {
        var result = PaginationHelper.Build(new List<string> { "a" }, 99, 10, 1);

        result.Page.Should().Be(1);
        result.TotalPages.Should().Be(1);
    }

    [Theory]
    [InlineData(0, 10, 0, 1)]
    [InlineData(0, 10, 25, 1)]
    [InlineData(5, 10, 25, 3)]
    [InlineData(99, 10, 25, 3)]
    public void ClampPage_Returns_Expected(int page, int pageSize, int totalCount, int expected)
    {
        PaginationHelper.ClampPage(page, pageSize, totalCount).Should().Be(expected);
    }
}
