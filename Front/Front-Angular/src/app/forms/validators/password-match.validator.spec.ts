import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { passwordMatchValidator } from './password-match.validator';

describe('passwordMatchValidator', () => {
  function build(password: string, confirm: string) {
    return new FormGroup(
      {
        newPassword: new FormControl(password),
        confirmPassword: new FormControl(confirm),
      },
      { validators: [passwordMatchValidator()] },
    );
  }

  it('returns null when confirm is empty', () => {
    const form = build('secret', '');
    expect(form.errors).toBeNull();
  });

  it('returns null when confirm is null or undefined', () => {
    const form = new FormGroup(
      {
        newPassword: new FormControl('secret'),
        confirmPassword: new FormControl(null),
      },
      { validators: [passwordMatchValidator()] },
    );
    expect(form.errors).toBeNull();

    form.get('confirmPassword')?.setValue(undefined);
    expect(form.errors).toBeNull();
  });

  it('returns passwordMismatch when values differ', () => {
    const form = build('secret', 'other');
    expect(form.errors).toEqual({ passwordMismatch: true });
  });

  it('returns null when password and confirm match', () => {
    const form = build('secret', 'secret');
    expect(form.errors).toBeNull();
  });

  it('returns null when both password fields are empty', () => {
    const form = build('', '');
    expect(form.errors).toBeNull();
  });

  it('supports custom field keys', () => {
    const form = new FormGroup(
      {
        password: new FormControl('a'),
        passwordConfirm: new FormControl('b'),
      },
      { validators: [passwordMatchValidator('password', 'passwordConfirm')] },
    );
    expect(form.errors).toEqual({ passwordMismatch: true });
  });
});
