using ErrorOr;
using Mapster;
using Microsoft.AspNetCore.Identity;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Errors;
using ProEventos.Services.Helpers;
using ProEventos.Services.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProEventos.Services.Services
{
    public class PalestranteService : IPalestranteService
    {
        private readonly IRepository<Palestrante> _repository;
        private readonly IPalestrantesRepository _palestrantesRepository;
        private readonly IEventoRepository _eventoRepository;
        private readonly UserManager<User> _userManager;

        public PalestranteService(
            IRepository<Palestrante> repository,
            IPalestrantesRepository palestrantesRepository,
            IEventoRepository eventoRepository,
            UserManager<User> userManager)
        {
            _repository = repository;
            _palestrantesRepository = palestrantesRepository;
            _eventoRepository = eventoRepository;
            _userManager = userManager;
        }

        public async Task<ErrorOr<List<PalestranteDto>>> GetAllAsync()
        {
            var list = await _palestrantesRepository.GetAllPalestrantesAsync(includeRedes: true);
            return list.Adapt<List<PalestranteDto>>();
        }

        public async Task<ErrorOr<PageResultDto<PalestranteDto>>> GetPagedAsync(
            int? page,
            int? pageSize,
            string q = null)
        {
            var (normalizedPage, normalizedSize) = PaginationHelper.Normalize(page, pageSize);
            var (items, totalCount) = await _palestrantesRepository.GetPagedPalestrantesAsync(
                normalizedPage,
                normalizedSize,
                q,
                includeRedes: true);

            var clampedPage = PaginationHelper.ClampPage(normalizedPage, normalizedSize, totalCount);
            if (clampedPage != normalizedPage && totalCount > 0)
            {
                (items, totalCount) = await _palestrantesRepository.GetPagedPalestrantesAsync(
                    clampedPage,
                    normalizedSize,
                    q,
                    includeRedes: true);
                normalizedPage = clampedPage;
            }

            var dtos = items?.Adapt<List<PalestranteDto>>() ?? new List<PalestranteDto>();
            return PaginationHelper.Build(dtos, normalizedPage, normalizedSize, totalCount);
        }

        public async Task<ErrorOr<PalestranteDto>> GetByIdAsync(int id)
        {
            var entity = await _palestrantesRepository.GetPalestranteByIdAsync(id, includeRedes: true);
            if (entity == null)
                return Error.NotFound("Palestrante.Get.NotFound", "Palestrante não encontrado");
            return entity.Adapt<PalestranteDto>();
        }

        public async Task<ErrorOr<PalestranteDto>> GetByUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return Error.Unauthorized("Palestrante.Me.Unauthorized", "Usuário não autenticado.");

            var entity = await _palestrantesRepository.GetPalestranteByUserIdAsync(userId);
            if (entity == null)
                return Error.NotFound("Palestrante.Me.NotFound", "Palestrante não encontrado para o usuário autenticado.");

            return await GetByIdAsync(entity.Id);
        }

        public async Task<ErrorOr<PalestranteDto>> AddAsync(PalestranteDto model)
        {
            var userCheck = await ValidateUserIdAsync(model?.UserId);
            if (userCheck.IsError)
                return userCheck.Errors;

            try
            {
                var existingLink = await _palestrantesRepository.GetPalestranteByUserIdAsync(model.UserId);
                if (existingLink != null)
                    return Error.Conflict("Palestrante.Add.UserAlreadyLinked", "Já existe palestrante para este usuário.");

                var entity = model.Adapt<Palestrante>();
                entity.Id = 0;
                var saved = await _repository.InsertAsync(entity);
                return await GetByIdAsync(saved.Id);
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<PalestranteDto>> UpdateAsync(
            int id,
            PalestranteDto model,
            string callerUserId,
            bool isOrganizer)
        {
            try
            {
                var existing = await _repository.SelectAsync(id);
                if (existing == null)
                    return Error.NotFound("Palestrante.Update.NotFound", "Palestrante não encontrado");

                var gate = EnsureCanWrite(existing, callerUserId, isOrganizer);
                if (gate.IsError)
                    return gate.Errors;

                if (model == null)
                    return Error.Validation("Palestrante.Update.BodyRequired", "Corpo da requisição é obrigatório.");

                if (string.IsNullOrWhiteSpace(model.UserId))
                    model.UserId = existing.UserId;

                var userCheck = await ValidateUserIdAsync(model.UserId);
                if (userCheck.IsError)
                    return userCheck.Errors;

                var linked = await _palestrantesRepository.GetPalestranteByUserIdAsync(model.UserId);
                if (linked != null && linked.Id != id)
                    return Error.Conflict("Palestrante.Update.UserAlreadyLinked", "Já existe palestrante para este usuário.");

                model.Id = id;
                await _repository.UpdateAsync(model.Adapt<Palestrante>());
                return await GetByIdAsync(id);
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<Success>> DeleteAsync(int id, string callerUserId, bool isOrganizer)
        {
            try
            {
                var existing = await _repository.SelectAsync(id);
                if (existing == null)
                    return Error.NotFound("Palestrante.Delete.NotFound", "Palestrante não encontrado");

                var gate = EnsureCanWrite(existing, callerUserId, isOrganizer);
                if (gate.IsError)
                    return gate.Errors;

                await _repository.DeleteAsync(id);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        private static ErrorOr<Success> EnsureCanWrite(Palestrante existing, string callerUserId, bool isOrganizer)
        {
            if (isOrganizer)
                return Result.Success;

            if (!ResourceOwnership.IsOwner(existing.UserId, callerUserId))
                return Error.Forbidden(
                    "Palestrante.Write.Forbidden",
                    "Você só pode alterar o seu próprio perfil de palestrante.");

            return Result.Success;
        }

        public async Task<ErrorOr<List<PalestranteDto>>> GetByNomeAsync(string nome)
        {
            var list = await _palestrantesRepository.GetAllPalestrantesByNameAsync(nome, includeEventos: true);
            return list.Adapt<List<PalestranteDto>>();
        }

        public async Task<ErrorOr<List<PalestranteDto>>> GetByTemaAsync(string tema)
        {
            var list = await _palestrantesRepository.GetAllPalestrantesByTemaAsync(tema);
            return list.Adapt<List<PalestranteDto>>();
        }

        public async Task<ErrorOr<Success>> AssociateAsync(int eventoId, int palestranteId, string userId)
        {
            var ownership = await EnsureEventoOwnerAsync(eventoId, userId, "Associate");
            if (ownership.IsError)
                return ownership.Errors;

            var ok = await _palestrantesRepository.AssociateAsync(eventoId, palestranteId);
            if (!ok)
                return Error.NotFound("Palestrante.Associate.NotFound", "Evento ou palestrante não encontrado");
            return Result.Success;
        }

        public async Task<ErrorOr<Success>> DisassociateAsync(int eventoId, int palestranteId, string userId)
        {
            var ownership = await EnsureEventoOwnerAsync(eventoId, userId, "Disassociate");
            if (ownership.IsError)
                return ownership.Errors;

            var ok = await _palestrantesRepository.DisassociateAsync(eventoId, palestranteId);
            if (!ok)
                return Error.NotFound("Palestrante.Disassociate.NotFound", "Associação não encontrada");
            return Result.Success;
        }

        private async Task<ErrorOr<Success>> EnsureEventoOwnerAsync(int eventoId, string userId, string action)
        {
            var evento = await _eventoRepository.GetAllEventosByIdAsync(eventoId, false);
            if (evento == null)
                return Error.NotFound($"Palestrante.{action}.EventoNotFound", "Evento não encontrado");

            if (!ResourceOwnership.IsOwner(evento.UserId, userId))
                return Error.Forbidden(
                    $"Palestrante.{action}.Forbidden",
                    "Você não é o dono deste evento.");

            return Result.Success;
        }

        private async Task<ErrorOr<Success>> ValidateUserIdAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return Error.Validation("Palestrante.UserId.Required", "UserId é obrigatório.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Error.NotFound("Palestrante.UserId.NotFound", "Usuário não encontrado para o UserId informado.");

            return Result.Success;
        }
    }
}
