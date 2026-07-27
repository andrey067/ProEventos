import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Evento, Lote, RedeSocial } from '../../models';
import { toDateInputValue } from '../../shared/date';
import { loteDateRangeValidator } from '../validators/lote-date-range.validator';
import { trimmedMinLength } from '../validators/trimmed-min-length.validator';

export function createEventoForm(fb: FormBuilder): FormGroup {
  return fb.group(
    {
      id: [0],
      tema: ['', [trimmedMinLength(1)]],
      local: ['', [trimmedMinLength(1)]],
      dataEvento: ['', { validators: [Validators.required], updateOn: 'change' }],
      qtdPessoas: [1, [Validators.min(1)]],
      telefone: ['', [trimmedMinLength(1)]],
      email: ['', [Validators.required, Validators.email]],
      imagemURL: [''],
      lotes: fb.array<FormGroup>([]),
      redes: fb.array<FormGroup>([]),
    },
    { updateOn: 'submit' },
  );
}

export function createLoteGroup(fb: FormBuilder, eventoId = 0): FormGroup {
  const today = toDateInputValue(new Date());
  return fb.group(
    {
      id: [0],
      nome: ['', [trimmedMinLength(1)]],
      preco: [
        1,
        {
          validators: [Validators.required, Validators.min(0.01)],
          updateOn: 'change',
        },
      ],
      dataIncio: [today, { updateOn: 'change' }],
      dataFim: [today, { updateOn: 'change' }],
      quantidade: [1, [Validators.min(1)]],
      eventoId: [eventoId],
    },
    { validators: [loteDateRangeValidator()] },
  );
}

export function createRedeGroup(fb: FormBuilder, eventoId = 0): FormGroup {
  return fb.group({
    id: [0],
    nome: [''],
    url: [''],
    eventoId: [eventoId],
  });
}

export function patchEventoForm(form: FormGroup, evento: Evento): void {
  form.patchValue({
    id: evento.id,
    tema: evento.tema,
    local: evento.local,
    dataEvento: toDateInputValue(evento.dataEvento),
    qtdPessoas: evento.qtdPessoas,
    telefone: evento.telefone,
    email: evento.email,
    imagemURL: evento.imagemURL,
  });
}

export function buildLotesFormArray(
  fb: FormBuilder,
  lotes: Lote[],
  eventoId = 0,
): FormArray<FormGroup> {
  return fb.array(
    lotes.map((lote) => {
      const resolvedEventoId = lote.eventoId || eventoId;
      const group = createLoteGroup(fb, resolvedEventoId);
      group.patchValue({
        ...lote,
        dataIncio: toDateInputValue(lote.dataIncio),
        dataFim: toDateInputValue(lote.dataFim),
        eventoId: resolvedEventoId,
      });
      return group;
    }),
  );
}

export function buildRedesFormArray(
  fb: FormBuilder,
  redes: RedeSocial[],
  eventoId = 0,
): FormArray<FormGroup> {
  return fb.array(
    redes.map((rede) => {
      const resolvedEventoId = rede.eventoId ?? eventoId;
      const group = createRedeGroup(fb, resolvedEventoId);
      group.patchValue({ ...rede, eventoId: resolvedEventoId });
      return group;
    }),
  );
}

export function setLotesFormArray(
  fb: FormBuilder,
  form: FormGroup,
  lotes: Lote[],
  eventoId = 0,
): void {
  form.setControl('lotes', buildLotesFormArray(fb, lotes, eventoId));
}

export function setRedesFormArray(
  fb: FormBuilder,
  form: FormGroup,
  redes: RedeSocial[],
  eventoId = 0,
): void {
  form.setControl('redes', buildRedesFormArray(fb, redes, eventoId));
}
