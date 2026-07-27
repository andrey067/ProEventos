using ErrorOr;
using Mapster;
using ProEventos.Domain.Entities;
using ProEventos.Domain.Exceptions;
using ProEventos.Domain.Interfaces.Repositories;
using ProEventos.Services.Dtos;
using ProEventos.Services.Errors;
using ProEventos.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProEventos.Services.Services
{
    public class LotesServices : ILotesService
    {
        private readonly ILotesRepository _lotesRepository;

        public LotesServices(ILotesRepository lotesRepository)
        {
            _lotesRepository = lotesRepository;
        }

        public async Task<ErrorOr<Success>> AddLote(int eventoId, LoteDto model)
        {
            var validation = ValidateLote(model);
            if (validation.IsError)
                return validation.Errors;

            try
            {
                var lote = model.Adapt<Lote>();
                lote.Id = 0;
                lote.EventoId = eventoId;
                lote.Evento = null;
                await _lotesRepository.InsertAsync(lote);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<Success>> DeleteLote(int eventoId, int loteId)
        {
            try
            {
                var lote = await _lotesRepository.GetLoteByIdsAsync(eventoId, loteId);
                if (lote == null)
                    return Error.NotFound("Lote.Delete.NotFound", "Lote para delete não encontrado.");

                await _lotesRepository.DeleteAsync(lote.Id);
                return Result.Success;
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        public async Task<ErrorOr<LoteDto>> GetLoteByIdsAsync(int eventoId, int loteId)
        {
            var lote = await _lotesRepository.GetLoteByIdsAsync(eventoId, loteId);
            if (lote == null)
                return Error.NotFound("Lote.Get.NotFound", "Lote não encontrado.");
            return lote.Adapt<LoteDto>();
        }

        public async Task<ErrorOr<List<LoteDto>>> GetLotesByEventoIdAsync(int eventoId)
        {
            var lotes = await _lotesRepository.GetLotesByEventoIdAsync(eventoId);
            return lotes?.Adapt<List<LoteDto>>() ?? new List<LoteDto>();
        }

        public async Task<ErrorOr<List<LoteDto>>> SaveLotes(int eventoId, List<LoteDto> models)
        {
            foreach (var model in models)
            {
                var validation = ValidateLote(model);
                if (validation.IsError)
                    return validation.Errors;
            }

            try
            {
                var lotes = await _lotesRepository.GetLotesByEventoIdAsync(eventoId) ?? new List<Lote>();

                foreach (var model in models)
                {
                    if (model.Id == 0)
                    {
                        var addResult = await AddLote(eventoId, model);
                        if (addResult.IsError)
                            return addResult.Errors;
                    }
                    else
                    {
                        var lote = lotes.FirstOrDefault(l => l.Id == model.Id);
                        if (lote == null) continue;
                        model.EventoId = eventoId;
                        model.Adapt(lote);
                        lote.EventoId = eventoId;
                        lote.Evento = null;
                        await _lotesRepository.UpdateAsync(lote);
                    }
                }

                var loteRetorno = await _lotesRepository.GetLotesByEventoIdAsync(eventoId);
                return loteRetorno.Adapt<List<LoteDto>>();
            }
            catch (AppException ex)
            {
                return ex.ToError();
            }
        }

        private static ErrorOr<Success> ValidateLote(LoteDto model)
        {
            if (string.IsNullOrWhiteSpace(model.Nome))
                return Error.Validation("Lote.Save.Validation", "Nome do lote é obrigatório.");
            if (model.Preco <= 0)
                return Error.Validation("Lote.Save.Validation", "Preço deve ser maior que zero.");
            if (model.Quantidade <= 0)
                return Error.Validation("Lote.Save.Validation", "Quantidade deve ser maior que zero.");
            if (model.DataIncio > model.DataFim)
                return Error.Validation("Lote.Save.Validation", "Data inicial não pode ser posterior à data final.");
            return Result.Success;
        }
    }
}
