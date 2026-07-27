import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { trimmedMinLength } from './trimmed-min-length.validator';

describe('trimmedMinLength', () => {
  it('fails when trimmed value is shorter than min', () => {
    const control = new FormControl('  a ');
    expect(trimmedMinLength(3)(control)).toEqual({
      trimmedMinLength: { requiredLength: 3, actualLength: 1 },
    });
  });

  it('passes when trimmed value meets min', () => {
    const control = new FormControl('  abc  ');
    expect(trimmedMinLength(3)(control)).toBeNull();
  });

  it('treats nullish as empty string', () => {
    const control = new FormControl(null);
    expect(trimmedMinLength(1)(control)).toEqual({
      trimmedMinLength: { requiredLength: 1, actualLength: 0 },
    });
  });
});
