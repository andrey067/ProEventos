using ErrorOr;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Errors;
using ProEventos.Services.Helpers;
using ProEventos.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProEventos.Services.Services
{
    public class RedeSocialService : IRedeSocialService
    {
        private readonly IRepository<RedeSocial> _repository;
        private readonly IEventoRepository _eventoRepository;
        private readonly IPalestrantesRepository _palestrantesRepository;

        public RedeSocialService(
            IRepository<RedeSocial> repository,
            IEventoRepository eventoRepository,
            IPalestrantesRepository palestrantesRepository)
        {
            _repository = repository;
            _eventoRepository = eventoRepository;
            _palestrantesRepository = palestrantesRepository;
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> GetByEventoIdAsync(int eventoId)
        {
            var all = await _repository.SelectAsyncAll();
            return all.Where(r => r.EventoId == eventoId).Adapt<List<RedeSocialDto>>();
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> SaveByEventoIdAsync(
            int eventoId,
            List<RedeSocialDto> models,
            string userId)
        {
            var ownership = await EnsureEventoOwnerAsync(eventoId, userId);
            if (ownership.IsError)
                return ownership.Errors;

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

        public async Task<ErrorOr<Success>> DeleteByEventoIdAsync(int eventoId, int redeSocialId, string userId)
        {
            var ownership = await EnsureEventoOwnerAsync(eventoId, userId);
            if (ownership.IsError)
                return ownership.Errors;

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

        public async Task<ErrorOr<List<RedeSocialDto>>> GetMineByUserIdAsync(string userId)
        {
            var palestrante = await ResolvePalestranteAsync(userId);
            if (palestrante.IsError)
                return palestrante.Errors;
            return await GetByPalestranteIdAsync(palestrante.Value.Id);
        }

        public async Task<ErrorOr<List<RedeSocialDto>>> SaveMineByUserIdAsync(string userId, List<RedeSocialDto> models)
        {
            var palestrante = await ResolvePalestranteAsync(userId);
            if (palestrante.IsError)
                return palestrante.Errors;
            return await SaveByPalestranteIdAsync(palestrante.Value.Id, models ?? new List<RedeSocialDto>());
        }

        public async Task<ErrorOr<Success>> DeleteMineByUserIdAsync(string userId, int redeSocialId)
        {
            var palestrante = await ResolvePalestranteAsync(userId);
            if (palestrante.IsError)
                return palestrante.Errors;
            return await DeleteByPalestranteIdAsync(palestrante.Value.Id, redeSocialId);
        }

        /// <summary>
        /// Mutating by explicit palestranteId: organizers (isOrganizer) may edit any;
        /// speakers may only edit their own linked profile.
        /// </summary>
        public async Task<ErrorOr<Success>> EnsureCanMutatePalestranteRedesAsync(
            int palestranteId,
            string userId,
            bool isOrganizer)
        {
            if (isOrganizer)
                return Result.Success;

            var linked = await _palestrantesRepository.GetPalestranteByUserIdAsync(userId);
            if (linked == null || linked.Id != palestranteId)
                return Error.Forbidden(
                    "RedeSocial.Palestrante.Forbidden",
                    "Você só pode alterar redes do seu próprio perfil de palestrante.");

            return Result.Success;
        }

        private async Task<ErrorOr<Success>> EnsureEventoOwnerAsync(int eventoId, string userId)
        {
            var evento = await _eventoRepository.GetAllEventosByIdAsync(eventoId, false);
            if (evento == null)
                return Error.NotFound("RedeSocial.Evento.NotFound", "Evento não encontrado");

            if (!ResourceOwnership.IsOwner(evento.UserId, userId))
                return Error.Forbidden(
                    "RedeSocial.Evento.Forbidden",
                    "Você não é o dono deste evento.");

            return Result.Success;
        }

        private async Task<ErrorOr<Palestrante>> ResolvePalestranteAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return Error.Unauthorized("RedeSocial.Palestrante.Unauthorized", "Usuário não autenticado.");

            var linked = await _palestrantesRepository.GetPalestranteByUserIdAsync(userId);
            if (linked == null)
                return Error.Forbidden(
                    "RedeSocial.Palestrante.NoProfile",
                    "Perfil de palestrante não encontrado para o usuário autenticado.");

            return linked;
        }
    }
}
