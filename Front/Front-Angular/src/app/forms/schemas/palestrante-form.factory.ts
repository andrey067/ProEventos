import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Palestrante } from '../../models';
import { trimmedMinLength } from '../validators/trimmed-min-length.validator';

export function createPalestranteForm(fb: FormBuilder): FormGroup {
  return fb.group(
    {
      nome: ['', [trimmedMinLength(1)]],
      miniCurriculo: [''],
      telefone: [''],
      email: [''],
      imagemURL: [''],
      redes: fb.array<FormGroup>([]),
    },
    { updateOn: 'submit' },
  );
}

export function patchPalestranteForm(form: FormGroup, palestrante: Omit<Palestrante, 'id'>): void {
  form.patchValue({
    nome: palestrante.nome,
    miniCurriculo: palestrante.miniCurriculo,
    imagemURL: palestrante.imagemURL,
    telefone: palestrante.telefone,
    email: palestrante.email,
  });
}

export function resetPalestranteForm(form: FormGroup): void {
  form.reset({
    nome: '',
    miniCurriculo: '',
    telefone: '',
    email: '',
    imagemURL: '',
  });
  form.setControl('redes', new FormArray<FormGroup>([]));
}
