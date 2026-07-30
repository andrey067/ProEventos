using FluentAssertions;
using ProEventos.Services.Helpers;
using Xunit;

namespace ProEventos.Services.Tests;

public class ResourceOwnershipTests
{
    [Theory]
    [InlineData(null, "user-1")]
    [InlineData("", "user-1")]
    [InlineData("   ", "user-1")]
    public void IsOwner_Returns_False_When_ResourceUserId_Blank(string resourceUserId, string callerUserId)
    {
        ResourceOwnership.IsOwner(resourceUserId, callerUserId).Should().BeFalse();
    }

    [Theory]
    [InlineData("user-1", null)]
    [InlineData("user-1", "")]
    [InlineData("user-1", "   ")]
    public void IsOwner_Returns_False_When_CallerUserId_Blank(string resourceUserId, string callerUserId)
    {
        ResourceOwnership.IsOwner(resourceUserId, callerUserId).Should().BeFalse();
    }

    [Fact]
    public void IsOwner_Returns_True_When_Ids_Match()
    {
        ResourceOwnership.IsOwner("user-1", "user-1").Should().BeTrue();
    }

    [Fact]
    public void IsOwner_Returns_True_When_Ids_Match_With_Trim()
    {
        ResourceOwnership.IsOwner(" user-1 ", "user-1").Should().BeTrue();
        ResourceOwnership.IsOwner("user-1", " user-1 ").Should().BeTrue();
    }

    [Fact]
    public void IsOwner_Returns_False_When_Ids_Mismatch()
    {
        ResourceOwnership.IsOwner("user-1", "user-2").Should().BeFalse();
    }
}
