import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { createEventoSearchForm } from './evento-search.factory';

describe('evento-search.factory', () => {
  it('creates search form with q control', () => {
    const form = createEventoSearchForm(new FormBuilder());
    expect(form.get('q')).toBeTruthy();
    form.patchValue({ q: 'angular' });
    expect(form.get('q')?.value).toBe('angular');
  });
});
