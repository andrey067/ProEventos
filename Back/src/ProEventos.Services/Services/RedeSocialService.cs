using ErrorOr;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Services.Dtos;
using ProEventos.Services.Errors;
using ProEventos.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProEventos.Services.Services
{
    public class RedeSocialService : IRedeSocialService
    {
        private readonly IRepository<RedeSocial> _repository;

        public RedeSocialService(IRepository<RedeSocial> repository)
        {
            _repository = repository;
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> GetByEventoIdAsync(int eventoId)
        {
            var all = await _repository.SelectAsyncAll();
            return all.Where(r => r.EventoId == eventoId).Adapt<List<RedeSocialDto>>();
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> SaveByEventoIdAsync(int eventoId, List<RedeSocialDto> models)
        {
            try
            {
                foreach (var model in models)
                {
                    model.EventoId = eventoId;
                    model.PalestranteId = null;
                    if (model.Id == 0)
                    {
                        var entity = model.Adapt<RedeSocial>();
                        entity.Id = 0;
                        await _repository.InsertAsync(entity);
                    }
                    else
                    {
                        var existing = await _repository.SelectAsync(model.Id);
                        if (existing == null || existing.EventoId != eventoId) continue;
                        model.Adapt(existing);
                        existing.EventoId = eventoId;
                        existing.PalestranteId = null;
                        await _repository.UpdateAsync(existing);
                    }
                }
                return await GetByEventoIdAsync(eventoId);
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<Success>> DeleteByEventoIdAsync(int eventoId, int redeSocialId)
        {
            try
            {
                var existing = await _repository.SelectAsync(redeSocialId);
                if (existing == null || existing.EventoId != eventoId)
                    return Error.NotFound("RedeSocial.Delete.NotFound", "Rede social não encontrada");

                await _repository.DeleteAsync(redeSocialId);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> GetByPalestranteIdAsync(int palestranteId)
        {
            var all = await _repository.SelectAsyncAll();
            return all.Where(r => r.PalestranteId == palestranteId).Adapt<List<RedeSocialDto>>();
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> SaveByPalestranteIdAsync(int palestranteId, List<RedeSocialDto> models)
        {
            try
            {
                foreach (var model in models)
                {
                    model.PalestranteId = palestranteId;
                    model.EventoId = null;
                    if (model.Id == 0)
                    {
                        var entity = model.Adapt<RedeSocial>();
                        entity.Id = 0;
                        await _repository.InsertAsync(entity);
                    }
                    else
                    {
                        var existing = await _repository.SelectAsync(model.Id);
                        if (existing == null || existing.PalestranteId != palestranteId) continue;
                        model.Adapt(existing);
                        existing.PalestranteId = palestranteId;
                        existing.EventoId = null;
                        await _repository.UpdateAsync(existing);
                    }
                }
                return await GetByPalestranteIdAsync(palestranteId);
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<Success>> DeleteByPalestranteIdAsync(int palestranteId, int redeSocialId)
        {
            try
            {
                var existing = await _repository.SelectAsync(redeSocialId);
                if (existing == null || existing.PalestranteId != palestranteId)
                    return Error.NotFound("RedeSocial.Delete.NotFound", "Rede social não encontrada");

                await _repository.DeleteAsync(redeSocialId);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }
    }
}
