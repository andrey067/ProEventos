using FluentAssertions;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Enum;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Helpers;
using ProEventos.Domain.Identity;
using Xunit;

namespace ProEventos.Persistence.Tests;

public class DomainTests
{
    [Fact]
    public void UnsplashPortraitPicker_At_Wraps_Index_And_Next_Returns_Url()
    {
        UnsplashPortraitPicker.At(0).Should().StartWith("https://images.unsplash.com/");
        UnsplashPortraitPicker.At(-1).Should().StartWith("https://images.unsplash.com/");
        UnsplashPortraitPicker.At(100).Should().StartWith("https://images.unsplash.com/");
        UnsplashPortraitPicker.Next().Should().StartWith("https://images.unsplash.com/");
    }

    [Fact]
    public void BaseEntity_CreateAt_Preserves_Explicit_Value()
    {
        var fixedDate = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var entity = new Evento { CreateAt = fixedDate };
        entity.CreateAt.Should().Be(fixedDate);
        entity.UpdateAt = fixedDate;
        entity.UpdateAt.Should().Be(fixedDate);
    }

    [Fact]
    public void Entity_Properties_Are_Settable()
    {
        var evento = new Evento
        {
            Local = "SP",
            DataEvento = DateTime.UtcNow,
            Tema = "Conf",
            QtdPessoas = 10,
            ImagemURL = "img.jpg",
            Telefone = "11",
            Email = "e@b.com",
            Lotes = new List<Lote>(),
            RedeSociais = new List<RedeSocial>(),
            PalestrantesEventos = new List<Palestrante_Evento>()
        };
        evento.Local.Should().Be("SP");

        var lote = new Lote
        {
            Nome = "VIP",
            Preco = 99.9m,
            DataIncio = DateTime.UtcNow,
            DataFim = DateTime.UtcNow.AddDays(1),
            Quantidade = 5,
            EventoId = 1,
            Evento = evento
        };
        lote.Preco.Should().Be(99.9m);

        var rede = new RedeSocial
        {
            Nome = "IG",
            URL = "https://ig",
            EventoId = 1,
            Evento = evento,
            PalestranteId = 2
        };
        rede.URL.Should().Be("https://ig");

        var user = new User
        {
            Nome = "Ana Silva",
            PrimeiroNome = "Ana",
            UltimoNome = "Silva",
            Titulo = Titulo.Bacharel,
            Funcao = Funcao.Palestrante,
            Telefone = "11999999999",
            Descricao = "Bio",
            ImagemURL = "https://img"
        };
        user.Funcao.Should().Be(Funcao.Palestrante);

        var palestrante = new Palestrante
        {
            Nome = "Ana",
            MiniCurriculo = "CV",
            ImagemURL = "img",
            Telefone = "11",
            Email = "a@b.com",
            UserId = "uid",
            User = user,
            RedeSociais = new[] { rede },
            PalestrantesEventos = new[]
            {
                new Palestrante_Evento
                {
                    PalestranteId = 1,
                    EventoId = 1,
                    Evento = evento,
                    Palestrante = null
                }
            }
        };
        palestrante.Nome.Should().Be("Ana");

        AppRoles.User.Should().Be("User");
        AppRoles.Palestrante.Should().Be("Palestrante");
        ((int)Funcao.Palestrante).Should().Be(2);
        ((int)Titulo.Doutorado).Should().Be(6);
    }

    [Fact]
    public void AppException_Constructors_Set_Properties()
    {
        var inner = new InvalidOperationException("inner");
        var persistence = new PersistenceException("op", "msg");
        persistence.Layer.Should().Be(AppLayer.Persistence);
        persistence.Operation.Should().Be("op");
        persistence.Message.Should().Be("msg");

        var withInner = new PersistenceException("op2", "msg2", inner);
        withInner.InnerException.Should().Be(inner);

        var notFound = new NotFoundException("nf", "missing");
        notFound.Layer.Should().Be(AppLayer.Persistence);
        var notFoundService = new NotFoundException(AppLayer.Service, "nf2", "missing2");
        notFoundService.Layer.Should().Be(AppLayer.Service);

        var conflict = new ConflictException("cf", "dup");
        conflict.Layer.Should().Be(AppLayer.Persistence);
        var conflictApi = new ConflictException(AppLayer.Api, "cf2", "dup2");
        conflictApi.Layer.Should().Be(AppLayer.Api);
    }
}
