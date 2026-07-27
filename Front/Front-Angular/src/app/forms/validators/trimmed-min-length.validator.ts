import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function trimmedMinLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const trimmed = String(control.value ?? '').trim();
    if (trimmed.length < min) {
      return {
        trimmedMinLength: { requiredLength: min, actualLength: trimmed.length },
      };
    }
    return null;
  };
}
