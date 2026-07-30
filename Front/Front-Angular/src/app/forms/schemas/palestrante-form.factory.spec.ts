import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  createPalestranteForm,
  patchPalestranteForm,
  resetPalestranteForm,
} from './palestrante-form.factory';

describe('palestrante-form.factory', () => {
  const fb = new FormBuilder();

  it('creates form with required nome', () => {
    const form = createPalestranteForm(fb);
    expect(form.get('nome')?.hasError('trimmedMinLength')).toBe(true);
    form.get('nome')?.setValue('Ana');
    expect(form.get('nome')?.valid).toBe(true);
  });

  it('patches and resets palestrante fields', () => {
    const form = createPalestranteForm(fb);
    patchPalestranteForm(form, {
      nome: 'Bruno',
      miniCurriculo: 'Bio',
      imagemURL: 'img.png',
      telefone: '11',
      email: 'b@test.com',
    });
    expect(form.get('email')?.value).toBe('b@test.com');

    resetPalestranteForm(form);
    expect(form.get('nome')?.value).toBe('');
    expect((form.get('redes') as { length: number }).length).toBe(0);
  });
});
