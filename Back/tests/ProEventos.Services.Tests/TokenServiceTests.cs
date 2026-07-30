using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using NetDevPack.Identity.Interfaces;
using NetDevPack.Identity.Jwt.Model;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Services;
using Xunit;

namespace ProEventos.Services.Tests;

public class TokenServiceTests
{
    private readonly Mock<UserManager<User>> _userManager = IdentityTestHelper.CreateUserManager();
    private readonly Mock<IJwtBuilder> _jwtBuilder = new();
    private readonly Mock<IPalestrantesRepository> _palestrantes = new();
    private readonly TokenService _sut;

    public TokenServiceTests()
    {
        SetupJwtBuilderChain();
        _sut = new TokenService(_userManager.Object, _jwtBuilder.Object, _palestrantes.Object);
    }

    private void SetupJwtBuilderChain()
    {
        _jwtBuilder.Setup(b => b.WithEmail(It.IsAny<string>())).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.WithUserId(It.IsAny<string>())).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.WithJwtClaims()).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.WithUserClaims()).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.WithUserRoles()).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.WithRefreshToken()).Returns(_jwtBuilder.Object);
        _jwtBuilder.Setup(b => b.BuildUserResponse()).ReturnsAsync(new UserResponse
        {
            AccessToken = "access",
            RefreshToken = "refresh",
            ExpiresIn = 3600
        });
    }

    [Fact]
    public async Task BuildAuthResponseAsync_Uses_Provided_PalestranteId()
    {
        var user = new User { Id = "u1", UserName = "ana", Email = "ana@test.com", Nome = "Ana" };
        _userManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });

        var result = await _sut.BuildAuthResponseAsync(user, 42);

        result.Token.Should().Be("access");
        result.RefreshToken.Should().Be("refresh");
        result.ExpiresIn.Should().Be(3600);
        result.PalestranteId.Should().Be(42);
        result.Roles.Should().ContainSingle("User");
        _palestrantes.Verify(r => r.GetPalestranteByUserIdAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task BuildAuthResponseAsync_Resolves_Palestrante_From_Repository()
    {
        var user = new User { Id = "u2", UserName = "bob", Email = "bob@test.com", Nome = "Bob" };
        _userManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync((IList<string>)null);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u2"))
            .ReturnsAsync(new Palestrante { Id = 9, UserId = "u2" });

        var result = await _sut.BuildAuthResponseAsync(user);

        result.PalestranteId.Should().Be(9);
        result.Roles.Should().BeEmpty();
    }

    [Fact]
    public async Task ValidateRefreshTokenAsync_Forwards_JwtBuilder_Result()
    {
        _jwtBuilder.Setup(b => b.ValidateRefreshToken("good"))
            .ReturnsAsync(new RefreshTokenValidation(true, "u1", null));
        _jwtBuilder.Setup(b => b.ValidateRefreshToken("bad"))
            .ReturnsAsync(new RefreshTokenValidation(false, null, "expired"));

        var ok = await _sut.ValidateRefreshTokenAsync("good");
        ok.IsValid.Should().BeTrue();
        ok.UserId.Should().Be("u1");

        var fail = await _sut.ValidateRefreshTokenAsync("bad");
        fail.IsValid.Should().BeFalse();
        fail.Reason.Should().Be("expired");
    }
}
