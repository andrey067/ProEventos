import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Group-level validator: confirm field must equal password field. */
export function passwordMatchValidator(
  passwordKey = 'newPassword',
  confirmKey = 'confirmPassword',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordKey)?.value;
    const confirm = control.get(confirmKey)?.value;
    if (confirm === null || confirm === undefined || confirm === '') {
      return null;
    }
    return password === confirm ? null : { passwordMismatch: true };
  };
}
