using System;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Services.Dtos;

namespace ProEventos.Services.Mappings
{
    public static class MapsterConfig
    {
        private static bool _registered;

        public static void Register()
        {
            if (_registered) return;
            _registered = true;

            TypeAdapterConfig<Evento, EventoDto>.NewConfig()
                .Map(dest => dest.RedesSociais, src => src.RedeSociais)
                .IgnoreNullValues(true);
            TypeAdapterConfig<EventoDto, Evento>.NewConfig()
                .Map(dest => dest.RedeSociais, src => src.RedesSociais)
                .Ignore(dest => dest.PalestrantesEventos)
                .IgnoreNullValues(true);

            TypeAdapterConfig<Lote, LoteDto>.NewConfig();
            TypeAdapterConfig<LoteDto, Lote>.NewConfig();

            TypeAdapterConfig<Palestrante, PalestranteDto>.NewConfig()
                .Map(dest => dest.RedesSociais, src => src.RedeSociais);
            TypeAdapterConfig<PalestranteDto, Palestrante>.NewConfig()
                .Map(dest => dest.RedeSociais, src => src.RedesSociais);

            TypeAdapterConfig<RedeSocial, RedeSocialDto>.NewConfig()
                .Ignore(dest => dest.Evento)
                .Ignore(dest => dest.Palestrante);
            TypeAdapterConfig<RedeSocialDto, RedeSocial>.NewConfig()
                .Ignore(dest => dest.Evento)
                .Ignore(dest => dest.Palestrante);
        }
    }
}
