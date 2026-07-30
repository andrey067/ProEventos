import { FormBuilder, FormGroup } from '@angular/forms';

export function createEventoSearchForm(fb: FormBuilder): FormGroup {
  return fb.group({
    q: [''],
  });
}
