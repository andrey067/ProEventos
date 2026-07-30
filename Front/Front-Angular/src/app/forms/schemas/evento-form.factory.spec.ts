import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  buildLotesFormArray,
  buildRedesFormArray,
  createEventoForm,
  createLoteGroup,
  createRedeGroup,
  patchEventoForm,
  setLotesFormArray,
  setRedesFormArray,
} from './evento-form.factory';
import type { Evento, Lote, RedeSocial } from '../../models';

describe('evento-form.factory', () => {
  const fb = new FormBuilder();

  it('creates evento form with empty lotes/redes arrays', () => {
    const form = createEventoForm(fb);
    expect(form.get('tema')).toBeTruthy();
    expect(form.get('local')?.hasError('trimmedMinLength')).toBe(true);
    expect(form.get('tema')?.hasError('trimmedMinLength')).toBe(true);
    form.get('tema')?.setValue('abcd');
    expect(form.get('tema')?.valid).toBe(true);
    form.get('tema')?.setValue('abc');
    expect(form.get('tema')?.hasError('trimmedMinLength')).toBe(true);
    expect((form.get('lotes') as { length: number }).length).toBe(0);
    expect((form.get('redes') as { length: number }).length).toBe(0);
  });

  it('updates local/telefone/email/dataEvento on change for live preview', () => {
    const form = createEventoForm(fb);
    for (const name of ['local', 'telefone', 'email', 'dataEvento'] as const) {
      expect(form.get(name)?.updateOn).toBe('change');
    }
    form.get('local')?.setValue('Arena');
    expect(form.get('local')?.value).toBe('Arena');
  });

  it('patches evento scalar fields', () => {
    const form = createEventoForm(fb);
    const evento: Evento = {
      id: 9,
      tema: 'Tema',
      local: 'SP',
      dataEvento: '01-01-2026',
      qtdPessoas: 10,
      telefone: '11999999999',
      email: 'a@b.com',
      imagemURL: 'img.png',
    };
    patchEventoForm(form, evento);
    expect(form.getRawValue()).toMatchObject({
      id: 9,
      tema: 'Tema',
      email: 'a@b.com',
    });
  });

  it('builds lotes preferring lote.eventoId over fallback', () => {
    const lotes: Lote[] = [
      {
        id: 1,
        nome: 'VIP',
        preco: 100,
        dataIncio: '',
        dataFim: '',
        quantidade: 5,
        eventoId: 42,
      },
      {
        id: 2,
        nome: 'Pista',
        preco: 50,
        dataIncio: '',
        dataFim: '',
        quantidade: 10,
        eventoId: 0,
      },
    ];
    const array = buildLotesFormArray(fb, lotes, 99);
    expect(array.at(0).get('eventoId')?.value).toBe(42);
    expect(array.at(1).get('eventoId')?.value).toBe(99);
  });

  it('builds redes preferring rede.eventoId with nullish coalesce', () => {
    const redes: RedeSocial[] = [
      { id: 1, nome: 'X', url: 'https://x.com', eventoId: 7 },
      { id: 2, nome: 'Y', url: 'https://y.com', eventoId: null },
    ];
    const array = buildRedesFormArray(fb, redes, 55);
    expect(array.at(0).get('eventoId')?.value).toBe(7);
    expect(array.at(1).get('eventoId')?.value).toBe(55);
  });

  it('creates rede group with required nome and url', () => {
    const group = createRedeGroup(fb);
    expect(group.get('nome')?.hasError('trimmedMinLength')).toBe(true);
    expect(group.get('url')?.hasError('trimmedMinLength')).toBe(true);
    group.patchValue({ nome: 'Twitter', url: 'https://x.com' });
    expect(group.valid).toBe(true);
  });

  it('creates lote group with validators and date defaults', () => {
    const form = createEventoForm(fb);
    const loteGroup = createLoteGroup(fb, 12);
    expect(loteGroup.get('eventoId')?.value).toBe(12);
    expect(loteGroup.get('nome')?.hasError('trimmedMinLength')).toBe(true);

    const lotes: Lote[] = [
      {
        id: 1,
        nome: 'VIP',
        preco: 100,
        dataIncio: '',
        dataFim: '',
        quantidade: 5,
        eventoId: 42,
      },
    ];
    const redes: RedeSocial[] = [
      { id: 1, nome: 'X', url: 'https://x.com', eventoId: 7 },
    ];

    setLotesFormArray(fb, form, lotes, 99);
    expect((form.get('lotes') as { length: number }).length).toBe(1);
    setRedesFormArray(fb, form, redes, 55);
    expect((form.get('redes') as { length: number }).length).toBe(1);
  });
});
