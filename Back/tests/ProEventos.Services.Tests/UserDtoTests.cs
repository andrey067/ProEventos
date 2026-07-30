using FluentAssertions;
using ProEventos.Domain.Enum;
using ProEventos.Services.Dtos;
using Xunit;

namespace ProEventos.Services.Tests;

public class UserDtoTests
{
    [Fact]
    public void Dtos_Expose_Properties()
    {
        var register = new UserRegisterDto
        {
            Nome = "Ana Silva",
            UserName = "ana",
            Email = "ana@test.com",
            Password = "secret"
        };
        register.Nome.Should().Be("Ana Silva");

        var speaker = new UserRegisterPalestranteDto
        {
            Nome = "Bob",
            UserName = "bob",
            Email = "bob@test.com",
            Password = "secret",
            Telefone = "11",
            MiniCurriculo = "bio",
            ImagemURL = "https://img.test/a.jpg"
        };
        speaker.MiniCurriculo.Should().Be("bio");

        var login = new UserLoginDto { UserName = "ana", Password = "secret" };
        login.UserName.Should().Be("ana");

        var update = new UserUpdateDto
        {
            UserName = "ana2",
            Email = "ana2@test.com",
            PrimeiroNome = "Ana",
            UltimoNome = "Silva",
            Titulo = Titulo.Bacharel,
            Funcao = Funcao.Participante,
            Telefone = "11",
            Descricao = "desc",
            ImagemURL = "https://img.test/b.jpg",
            Password = "new",
            Nome = "legacy"
        };
        update.Funcao.Should().Be(Funcao.Participante);

        var change = new ChangePasswordDto { CurrentPassword = "old", NewPassword = "new" };
        change.NewPassword.Should().Be("new");

        var refresh = new RefreshTokenRequestDto { RefreshToken = "rt" };
        refresh.RefreshToken.Should().Be("rt");

        var profile = new UserDto
        {
            UserName = "ana",
            Email = "ana@test.com",
            Nome = "Ana Silva",
            PrimeiroNome = "Ana",
            UltimoNome = "Silva",
            Titulo = Titulo.Bacharel,
            Funcao = Funcao.Palestrante,
            Telefone = "11",
            Descricao = "bio",
            ImagemURL = "https://img.test/c.jpg",
            EventosMinistrados = 2,
            EventosParticipados = 3
        };
        profile.EventosMinistrados.Should().Be(2);

        var auth = new AuthResponseDto
        {
            Token = "jwt",
            RefreshToken = "rt",
            ExpiresIn = 3600,
            UserName = "ana",
            Email = "ana@test.com",
            Nome = "Ana",
            Roles = new List<string> { "User" },
            PalestranteId = 7
        };
        auth.PalestranteId.Should().Be(7);
    }
}
