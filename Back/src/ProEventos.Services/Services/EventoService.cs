using ErrorOr;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Interfaces;
using ProEventos.Services.Dtos;
using ProEventos.Services.Errors;
using ProEventos.Services.Helpers;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services
{
    public class EventoService : IEventoService
    {
        private readonly IRepository<Evento> _repository;
        private readonly IEventoRepository _eventoRepository;

        public EventoService(IRepository<Evento> repository, IEventoRepository eventoRepository)
        {
            _repository = repository;
            _eventoRepository = eventoRepository;
        }

        public async Task<ErrorOr<EventoDto>> AddEvento(EventoDto model, string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return Error.Validation("Evento.Add.UserIdRequired", "UserId é obrigatório para criar evento.");

            try
            {
                var entity = model.Adapt<Evento>();
                entity.Id = 0;
                entity.UserId = userId;
                var eventoSalvo = await _repository.InsertAsync(entity);
                var dto = (await _eventoRepository.GetAllEventosByIdAsync(eventoSalvo.Id, false)).Adapt<EventoDto>();
                return dto;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<Success>> DeleteEvento(int eventoId, string userId)
        {
            try
            {
                var evento = await _eventoRepository.GetAllEventosByIdAsync(eventoId, false);
                if (evento == null)
                    return Error.NotFound("Evento.Delete.NotFound", "Evento não foi encontrado");

                if (!ResourceOwnership.IsOwner(evento.UserId, userId))
                    return Error.Forbidden("Evento.Delete.Forbidden", "Você não é o dono deste evento.");

                await _repository.DeleteAsync(evento.Id);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<EventoDto>> Get(int id)
        {
            var entity = await _repository.SelectAsync(id);
            if (entity == null)
                return Error.NotFound("Evento.Get.NotFound", "Evento não foi encontrado");
            return entity.Adapt<EventoDto>();
        }

        public async Task<ErrorOr<IEnumerable<EventoDto>>> GetAll()
        {
            var listEntity = await _repository.SelectAsyncAll();
            return listEntity.Adapt<List<EventoDto>>();
        }

        public async Task<ErrorOr<EventoDto>> UpdateEvento(int eventoId, EventoDto model, string userId)
        {
            try
            {
                var evento = await _eventoRepository.GetAllEventosByIdAsync(eventoId, false);
                if (evento == null)
                    return Error.NotFound("Evento.Update.NotFound", "Evento não foi encontrado");

                if (!ResourceOwnership.IsOwner(evento.UserId, userId))
                    return Error.Forbidden("Evento.Update.Forbidden", "Você não é o dono deste evento.");

                model.Id = eventoId;
                model.UserId = evento.UserId;
                var entity = model.Adapt<Evento>();
                entity.UserId = evento.UserId;
                var eventoSalvo = await _repository.UpdateAsync(entity);
                if (eventoSalvo == null)
                    return Error.NotFound("Evento.Update.NotFound", "Evento não foi encontrado");

                return (await _eventoRepository.GetAllEventosByIdAsync(eventoId, false)).Adapt<EventoDto>();
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<List<EventoDto>>> GetAllEventosAsync(bool includePalestrante = false)
        {
            var eventos = await _eventoRepository.GetAllEventosAsync(includePalestrante);
            return eventos?.Adapt<List<EventoDto>>() ?? new List<EventoDto>();
        }

        public async Task<ErrorOr<PageResultDto<EventoDto>>> GetPagedEventosAsync(
            int? page,
            int? pageSize,
            string q = null,
            bool includePalestrante = false,
            string userId = null)
        {
            var (normalizedPage, normalizedSize) = PaginationHelper.Normalize(page, pageSize);
            var (items, totalCount) = await _eventoRepository.GetPagedEventosAsync(
                normalizedPage,
                normalizedSize,
                q,
                includePalestrante,
                userId);

            var clampedPage = PaginationHelper.ClampPage(normalizedPage, normalizedSize, totalCount);
            if (clampedPage != normalizedPage && totalCount > 0)
            {
                (items, totalCount) = await _eventoRepository.GetPagedEventosAsync(
                    clampedPage,
                    normalizedSize,
                    q,
                    includePalestrante,
                    userId);
                normalizedPage = clampedPage;
            }

            var dtos = items?.Adapt<List<EventoDto>>() ?? new List<EventoDto>();
            return PaginationHelper.Build(dtos, normalizedPage, normalizedSize, totalCount);
        }

        public async Task<ErrorOr<EventoDto>> GetAllEventosByIdAsync(int eventoId, bool includePalestrante)
        {
            var evento = await _eventoRepository.GetAllEventosByIdAsync(eventoId, includePalestrante);
            if (evento == null)
                return Error.NotFound("Evento.GetById.NotFound", "Evento não foi encontrado");
            return evento.Adapt<EventoDto>();
        }

        public async Task<ErrorOr<List<EventoDto>>> GetAllEventosByTemaAsync(string tema, bool includePalestrante)
        {
            var eventos = await _eventoRepository.GetAllEventosByTemaAsync(tema, includePalestrante);
            return eventos?.Adapt<List<EventoDto>>() ?? new List<EventoDto>();
        }
    }
}
