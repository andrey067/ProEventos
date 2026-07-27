using FluentAssertions;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Services.Dtos;
using ProEventos.Services.Mappings;
using Xunit;

namespace ProEventos.Services.Tests;

public class MapsterConfigTests
{
    [Fact]
    public void Register_Is_Idempotent()
    {
        MapsterConfig.Register();
        MapsterConfig.Register();
        var entity = new Evento { Id = 1, Tema = "T", Telefone = "11", Email = "a@b.com", QtdPessoas = 1 };
        entity.Adapt<EventoDto>().Tema.Should().Be("T");
    }

    [Fact]
    public void Evento_Dto_To_Entity_Ignores_PalestrantesEventos()
    {
        MapsterConfig.Register();
        var dto = new EventoDto
        {
            Tema = "Conf",
            Telefone = "11",
            Email = "a@b.com",
            QtdPessoas = 5,
            RedesSociais = new[] { new RedeSocialDto { Nome = "IG", URL = "https://ig" } }
        };

        var entity = dto.Adapt<Evento>();

        entity.PalestrantesEventos.Should().BeNull();
        entity.Tema.Should().Be("Conf");
    }

    [Fact]
    public void Palestrante_Maps_RedesSociais_Both_Ways()
    {
        MapsterConfig.Register();
        var entity = new Palestrante
        {
            Id = 2,
            Nome = "Ana",
            RedeSociais = new[] { new RedeSocial { Nome = "LI", URL = "https://li" } }
        };

        var dto = entity.Adapt<PalestranteDto>();
        dto.RedesSociais.Should().ContainSingle(r => r.Nome == "LI");

        var back = dto.Adapt<Palestrante>();
        back.RedeSociais.Should().ContainSingle(r => r.Nome == "LI");
    }

    [Fact]
    public void Lote_And_RedeSocial_Map_Both_Ways()
    {
        MapsterConfig.Register();
        var lote = new Lote { Id = 1, Nome = "VIP", Preco = 99, EventoId = 3 };
        lote.Adapt<LoteDto>().Nome.Should().Be("VIP");

        var rede = new RedeSocialDto { Nome = "YT", URL = "https://yt", EventoId = 1 };
        rede.Adapt<RedeSocial>().Nome.Should().Be("YT");
    }
}
