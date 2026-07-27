import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { parseDateBr } from '../../shared/date';

export function loteDateRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const inicio = control.get('dataIncio')?.value as string;
    const fim = control.get('dataFim')?.value as string;

    if (!inicio?.trim() || !fim?.trim()) return null;

    const start = parseDateBr(inicio);
    const end = parseDateBr(fim);
    if (!start || !end) return null;

    return end < start ? { loteDateRange: true } : null;
  };
}
