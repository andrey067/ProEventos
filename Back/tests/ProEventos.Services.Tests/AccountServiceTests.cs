using ErrorOr;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Moq;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Enum;
using ProEventos.Domain.Identity;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Interfaces;
using ProEventos.Services.Services;
using Xunit;

namespace ProEventos.Services.Tests;

public class AccountServiceTests
{
    private readonly Mock<UserManager<User>> _userManager = IdentityTestHelper.CreateUserManager();
    private readonly Mock<RoleManager<IdentityRole>> _roleManager = IdentityTestHelper.CreateRoleManager();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IPalestrantesRepository> _palestrantes = new();
    private readonly AccountService _sut;

    public AccountServiceTests()
    {
        _roleManager.Setup(r => r.RoleExistsAsync(It.IsAny<string>())).ReturnsAsync(true);
        _sut = new AccountService(
            _userManager.Object,
            _roleManager.Object,
            _tokenService.Object,
            _palestrantes.Object);
    }

    private static UserRegisterDto RegisterDto(string email = "ana@test.com", string userName = "ana") => new()
    {
        Nome = "Ana Silva",
        Email = email,
        UserName = userName,
        Password = "secret123"
    };

    private static UserRegisterPalestranteDto RegisterPalestranteDto(string imagemUrl = null) => new()
    {
        Nome = "Bob Speaker",
        Email = "bob@test.com",
        UserName = "bob",
        Password = "secret123",
        Telefone = "11999999999",
        MiniCurriculo = "bio",
        ImagemURL = imagemUrl
    };

    private static UserUpdateDto ValidUpdate(Funcao funcao = Funcao.Participante) => new()
    {
        PrimeiroNome = "Ana",
        UltimoNome = "Silva",
        Email = "ana@test.com",
        Telefone = "11999999999",
        Descricao = "desc",
        Titulo = Titulo.Bacharel,
        Funcao = funcao
    };

    private void SetupAuthResponse(string userId = "u1") =>
        _tokenService.Setup(t => t.BuildAuthResponseAsync(It.IsAny<User>(), It.IsAny<int?>()))
            .ReturnsAsync(new AuthResponseDto { Token = "jwt", UserName = "ana", Email = "ana@test.com" });

    [Fact]
    public async Task RegisterAsync_Returns_Conflict_When_Email_In_Use()
    {
        _userManager.Setup(m => m.FindByEmailAsync("ana@test.com"))
            .ReturnsAsync(new User { Id = "x" });

        var result = await _sut.RegisterAsync(RegisterDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Account.Register.EmailInUse");
    }

    [Fact]
    public async Task RegisterAsync_Returns_Conflict_When_UserName_In_Use()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.FindByNameAsync("ana"))
            .ReturnsAsync(new User { Id = "x" });

        var result = await _sut.RegisterAsync(RegisterDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Account.Register.UserNameInUse");
    }

    [Fact]
    public async Task RegisterAsync_Returns_Validation_When_Create_Fails()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "weak password" }));

        var result = await _sut.RegisterAsync(RegisterDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Validation);
        result.FirstError.Description.Should().Contain("weak password");
    }

    [Fact]
    public async Task RegisterAsync_Succeeds_And_Assigns_User_Role()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _roleManager.Setup(r => r.RoleExistsAsync(AppRoles.User)).ReturnsAsync(false);
        _roleManager.Setup(r => r.CreateAsync(It.Is<IdentityRole>(x => x.Name == AppRoles.User)))
            .ReturnsAsync(IdentityResult.Success);
        SetupAuthResponse();

        var result = await _sut.RegisterAsync(RegisterDto());

        result.IsError.Should().BeFalse();
        _userManager.Verify(m => m.AddToRoleAsync(It.IsAny<User>(), AppRoles.User), Times.Once);
        _tokenService.Verify(t => t.BuildAuthResponseAsync(It.IsAny<User>(), null), Times.Once);
    }

    [Fact]
    public async Task RegisterPalestranteAsync_Succeeds_And_Uses_Custom_Image()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);
        _roleManager.Setup(r => r.RoleExistsAsync(AppRoles.Palestrante)).ReturnsAsync(true);
        Palestrante inserted = null;
        _palestrantes.Setup(r => r.InsertAsync(It.IsAny<Palestrante>()))
            .Callback<Palestrante>(p => { p.Id = 5; inserted = p; })
            .ReturnsAsync((Palestrante p) => p);
        SetupAuthResponse();

        var result = await _sut.RegisterPalestranteAsync(
            RegisterPalestranteDto("https://cdn.test/custom.jpg"));

        result.IsError.Should().BeFalse();
        inserted.ImagemURL.Should().Be("https://cdn.test/custom.jpg");
        _tokenService.Verify(t => t.BuildAuthResponseAsync(It.IsAny<User>(), 5), Times.Once);
    }

    [Fact]
    public async Task RegisterPalestranteAsync_Returns_Validation_When_Create_Fails()
    {
        _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User)null);
        _userManager.Setup(m => m.CreateAsync(It.IsAny<User>(), It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "invalid" }));

        var result = await _sut.RegisterPalestranteAsync(RegisterPalestranteDto());

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Account.RegisterPalestrante.Failed");
    }

    [Fact]
    public async Task LoginAsync_Returns_Unauthorized_When_User_Missing()
    {
        _userManager.Setup(m => m.FindByNameAsync("ana")).ReturnsAsync((User)null);

        var result = await _sut.LoginAsync(new UserLoginDto { UserName = "ana", Password = "x" });

        result.IsError.Should().BeTrue();
        result.FirstError.Type.Should().Be(ErrorType.Unauthorized);
    }

    [Fact]
    public async Task LoginAsync_Returns_Unauthorized_When_Password_Invalid()
    {
        var user = new User { Id = "u1", UserName = "ana" };
        _userManager.Setup(m => m.FindByNameAsync("ana")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "bad")).ReturnsAsync(false);

        var result = await _sut.LoginAsync(new UserLoginDto { UserName = "ana", Password = "bad" });

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Account.Login.InvalidCredentials");
    }

    [Fact]
    public async Task LoginAsync_Succeeds_When_Credentials_Valid()
    {
        var user = new User { Id = "u1", UserName = "ana" };
        _userManager.Setup(m => m.FindByNameAsync("ana")).ReturnsAsync(user);
        _userManager.Setup(m => m.CheckPasswordAsync(user, "good")).ReturnsAsync(true);
        SetupAuthResponse();

        var result = await _sut.LoginAsync(new UserLoginDto { UserName = "ana", Password = "good" });

        result.IsError.Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task RefreshTokenAsync_Requires_Token(string token)
    {
        var result = await _sut.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = token });

        result.IsError.Should().BeTrue();
        result.FirstError.Code.Should().Be("Account.Refresh.Required");
    }

    [Fact]
    public async Task RefreshTokenAsync_Returns_Unauthorized_When_Invalid()
    {
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync("bad"))
            .ReturnsAsync((false, (string)null, (string)null));

        var result = await _sut.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "bad" });

        result.IsError.Should().BeTrue();
        result.FirstError.Description.Should().Contain("inválido");
    }

    [Fact]
    public async Task RefreshTokenAsync_Uses_Reason_When_Provided()
    {
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync("expired"))
            .ReturnsAsync((false, (string)null, "token expired"));

        var result = await _sut.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "expired" });

        result.FirstError.Description.Should().Be("token expired");
    }

    [Fact]
    public async Task RefreshTokenAsync_Returns_Unauthorized_When_User_Missing()
    {
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync("ok"))
            .ReturnsAsync((true, "missing", (string)null));
        _userManager.Setup(m => m.FindByIdAsync("missing")).ReturnsAsync((User)null);

        var result = await _sut.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "ok" });

        result.FirstError.Code.Should().Be("Account.Refresh.UserNotFound");
    }

    [Fact]
    public async Task RefreshTokenAsync_Succeeds_When_Valid()
    {
        var user = new User { Id = "u1", UserName = "ana" };
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync("ok"))
            .ReturnsAsync((true, "u1", (string)null));
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        SetupAuthResponse();

        var result = await _sut.RefreshTokenAsync(new RefreshTokenRequestDto { RefreshToken = "ok" });

        result.IsError.Should().BeFalse();
    }

    [Fact]
    public async Task GetProfileAsync_Returns_NotFound_When_Missing()
    {
        _userManager.Setup(m => m.FindByIdAsync("x")).ReturnsAsync((User)null);

        var result = await _sut.GetProfileAsync("x");

        result.FirstError.Code.Should().Be("Account.Profile.NotFound");
    }

    [Fact]
    public async Task GetProfileAsync_Maps_User_With_Event_Counts()
    {
        var user = new User
        {
            Id = "u1",
            UserName = "ana",
            Email = "ana@test.com",
            Nome = "Ana Silva",
            PrimeiroNome = "Ana",
            UltimoNome = "Silva",
            Funcao = Funcao.Palestrante,
            Titulo = Titulo.Bacharel,
            Telefone = "11",
            Descricao = "bio"
        };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1"))
            .ReturnsAsync(new Palestrante { Id = 3, UserId = "u1" });
        _palestrantes.Setup(r => r.CountEventosByPalestranteIdAsync(3)).ReturnsAsync(4);

        var result = await _sut.GetProfileAsync("u1");

        result.Value.EventosMinistrados.Should().Be(4);
        result.Value.Nome.Should().Be("Ana Silva");
    }

    [Fact]
    public async Task GetProfileAsync_Splits_Legacy_Nome_When_Parts_Missing()
    {
        var user = new User
        {
            Id = "u1",
            UserName = "ana",
            Email = "ana@test.com",
            Nome = "Ana Silva",
            PrimeiroNome = null,
            UltimoNome = null
        };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1")).ReturnsAsync((Palestrante)null);

        var result = await _sut.GetProfileAsync("u1");

        result.Value.PrimeiroNome.Should().Be("Ana");
        result.Value.UltimoNome.Should().Be("Silva");
    }

    [Theory]
    [InlineData(null, "Account.Update.PrimeiroNome")]
    [InlineData("", "Account.Update.UltimoNome")]
    [InlineData(" ", "Account.Update.Email")]
    public async Task UpdateProfileAsync_Validates_Required_Fields(string blankField, string expectedCode)
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        var model = ValidUpdate();
        if (expectedCode.Contains("PrimeiroNome")) model.PrimeiroNome = blankField;
        else if (expectedCode.Contains("UltimoNome")) model.UltimoNome = blankField;
        else model.Email = blankField;

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.FirstError.Code.Should().Be(expectedCode);
    }

    [Fact]
    public async Task UpdateProfileAsync_Returns_Conflict_When_Email_Taken()
    {
        var user = new User { Id = "u1", Email = "old@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.FindByEmailAsync("new@test.com"))
            .ReturnsAsync(new User { Id = "other" });
        var model = ValidUpdate();
        model.Email = "new@test.com";

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.FirstError.Code.Should().Be("Account.Update.EmailInUse");
    }

    [Fact]
    public async Task UpdateProfileAsync_Returns_Conflict_When_UserName_Taken()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.FindByNameAsync("taken"))
            .ReturnsAsync(new User { Id = "other" });
        var model = ValidUpdate();
        model.UserName = "taken";

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.FirstError.Code.Should().Be("Account.Update.UserNameInUse");
    }

    [Fact]
    public async Task UpdateProfileAsync_Rejects_Invalid_Https_Image()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        var model = ValidUpdate();
        model.ImagemURL = "http://insecure.test/a.jpg";

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.FirstError.Code.Should().Be("Account.Update.ImagemURL");
    }

    [Fact]
    public async Task UpdateProfileAsync_Clears_And_Sets_Image()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana", ImagemURL = "https://old.test/a.jpg" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.UpdateAsync(It.IsAny<User>())).ReturnsAsync(IdentityResult.Success);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1")).ReturnsAsync((Palestrante)null);

        var clear = ValidUpdate();
        clear.ImagemURL = "";
        (await _sut.UpdateProfileAsync("u1", clear)).Value.ImagemURL.Should().BeNull();

        var set = ValidUpdate();
        set.ImagemURL = "https://new.test/b.jpg";
        (await _sut.UpdateProfileAsync("u1", set)).Value.ImagemURL.Should().Be("https://new.test/b.jpg");
    }

    [Fact]
    public async Task UpdateProfileAsync_Ensures_Palestrante_Profile_And_Roles()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana", Nome = "Ana Silva" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.UpdateAsync(It.IsAny<User>())).ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(m => m.IsInRoleAsync(user, AppRoles.User)).ReturnsAsync(true);
        _userManager.Setup(m => m.IsInRoleAsync(user, AppRoles.Palestrante)).ReturnsAsync(false);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1")).ReturnsAsync((Palestrante)null);
        _palestrantes.Setup(r => r.InsertAsync(It.IsAny<Palestrante>())).ReturnsAsync((Palestrante p) => p);
        _palestrantes.Setup(r => r.CountEventosByPalestranteIdAsync(It.IsAny<int>())).ReturnsAsync(0);
        _roleManager.Setup(r => r.RoleExistsAsync(AppRoles.Palestrante)).ReturnsAsync(true);

        var model = ValidUpdate(Funcao.Palestrante);
        var result = await _sut.UpdateProfileAsync("u1", model);

        result.IsError.Should().BeFalse();
        _palestrantes.Verify(r => r.InsertAsync(It.IsAny<Palestrante>()), Times.Once);
        _userManager.Verify(m => m.RemoveFromRoleAsync(user, AppRoles.User), Times.Once);
        _userManager.Verify(m => m.AddToRoleAsync(user, AppRoles.Palestrante), Times.Once);
    }

    [Fact]
    public async Task UpdateProfileAsync_Returns_Validation_When_Password_Reset_Fails()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("token");
        _userManager.Setup(m => m.ResetPasswordAsync(user, "token", "weak"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "too weak" }));
        var model = ValidUpdate();
        model.Password = "weak";

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.FirstError.Code.Should().Be("Account.Update.PasswordFailed");
    }

    [Fact]
    public async Task UpdateProfileAsync_Returns_Validation_When_Update_Fails()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.UpdateAsync(It.IsAny<User>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "db error" }));
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1")).ReturnsAsync((Palestrante)null);
        _palestrantes.Setup(r => r.CountEventosByPalestranteIdAsync(It.IsAny<int>())).ReturnsAsync(0);

        var result = await _sut.UpdateProfileAsync("u1", ValidUpdate());

        result.FirstError.Code.Should().Be("Account.Update.Failed");
    }

    [Fact]
    public async Task UpdateProfileAsync_Succeeds_With_Password_Change()
    {
        var user = new User { Id = "u1", Email = "ana@test.com", UserName = "ana" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.GeneratePasswordResetTokenAsync(user)).ReturnsAsync("token");
        _userManager.Setup(m => m.ResetPasswordAsync(user, "token", "Strong1!"))
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(m => m.UpdateSecurityStampAsync(user)).ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(m => m.UpdateAsync(It.IsAny<User>())).ReturnsAsync(IdentityResult.Success);
        _palestrantes.Setup(r => r.GetPalestranteByUserIdAsync("u1")).ReturnsAsync((Palestrante)null);
        _palestrantes.Setup(r => r.CountEventosByPalestranteIdAsync(It.IsAny<int>())).ReturnsAsync(0);
        var model = ValidUpdate();
        model.Password = "Strong1!";
        model.UserName = " ana2 ";
        model.Email = " ANA@TEST.COM ";

        var result = await _sut.UpdateProfileAsync("u1", model);

        result.IsError.Should().BeFalse();
        user.UserName.Should().Be("ana2");
        user.Email.Should().Be("ANA@TEST.COM");
    }

    [Fact]
    public async Task ChangePasswordAsync_Returns_NotFound_When_User_Missing()
    {
        _userManager.Setup(m => m.FindByIdAsync("x")).ReturnsAsync((User)null);

        var result = await _sut.ChangePasswordAsync("x", new ChangePasswordDto { CurrentPassword = "a", NewPassword = "b" });

        result.FirstError.Code.Should().Be("Account.ChangePassword.NotFound");
    }

    [Fact]
    public async Task ChangePasswordAsync_Returns_Validation_When_Failed()
    {
        var user = new User { Id = "u1" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "wrong current" }));

        var result = await _sut.ChangePasswordAsync("u1", new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" });

        result.FirstError.Code.Should().Be("Account.ChangePassword.Failed");
    }

    [Fact]
    public async Task ChangePasswordAsync_Succeeds_And_Refreshes_Tokens()
    {
        var user = new User { Id = "u1" };
        _userManager.Setup(m => m.FindByIdAsync("u1")).ReturnsAsync(user);
        _userManager.Setup(m => m.ChangePasswordAsync(user, "old", "new"))
            .ReturnsAsync(IdentityResult.Success);
        _userManager.Setup(m => m.UpdateSecurityStampAsync(user)).ReturnsAsync(IdentityResult.Success);
        SetupAuthResponse();

        var result = await _sut.ChangePasswordAsync("u1", new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" });

        result.IsError.Should().BeFalse();
        _tokenService.Verify(t => t.BuildAuthResponseAsync(user, null), Times.Once);
    }

    [Theory]
    [InlineData(null, "", "")]
    [InlineData("  ", "", "")]
    [InlineData("Ana", "Ana", "Ana")]
    [InlineData("Ana Silva", "Ana", "Silva")]
    public void SplitNome_Handles_Common_Inputs(string nome, string primeiro, string ultimo)
    {
        var (p, u) = AccountService.SplitNome(nome);
        p.Should().Be(primeiro);
        u.Should().Be(ultimo);
    }

    [Theory]
    [InlineData(null, null, "")]
    [InlineData("Ana", null, "Ana")]
    [InlineData("Ana", "Ana", "Ana")]
    [InlineData("Ana", "Silva", "Ana Silva")]
    public void BuildNome_Formats_Display_Name(string primeiro, string ultimo, string expected)
    {
        AccountService.BuildNome(primeiro, ultimo).Should().Be(expected);
    }
}
