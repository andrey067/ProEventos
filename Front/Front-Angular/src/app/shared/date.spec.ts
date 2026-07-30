import { describe, expect, it } from 'vitest';
import {
  formatDateBr,
  parseDateBr,
  toApiDate,
  toDateInputValue,
} from './date';

describe('date helpers', () => {
  it('formats Date and parsed strings', () => {
    expect(formatDateBr(new Date(2026, 6, 29))).toBe('29/07/2026');
    expect(formatDateBr('29/07/2026')).toBe('29/07/2026');
    expect(formatDateBr('2026-07-29')).toBe('29/07/2026');
    expect(formatDateBr('29-07-2026')).toBe('29/07/2026');
    expect(formatDateBr(null)).toBe('');
    expect(formatDateBr('not-a-date')).toBe('not-a-date');
  });

  it('parses BR, legacy and ISO strings', () => {
    expect(parseDateBr('01/01/2026')?.getFullYear()).toBe(2026);
    expect(parseDateBr('01-01-2026')?.getDate()).toBe(1);
    expect(parseDateBr('2026-01-01')?.getMonth()).toBe(0);
    expect(parseDateBr('31/02/2026')).toBeNull();
    expect(parseDateBr('')).toBeNull();
  });

  it('parses API BR datetime with time suffix', () => {
    expect(parseDateBr('15/12/2027 00:00:00')?.getFullYear()).toBe(2027);
    expect(parseDateBr('15/12/2027 00:00:00')?.getMonth()).toBe(11);
    expect(parseDateBr('15/12/2027 00:00:00')?.getDate()).toBe(15);
    expect(toDateInputValue('15/12/2027 00:00:00')).toBe('2027-12-15');
    expect(formatDateBr('15/12/2027 00:00:00')).toBe('15/12/2027');
  });

  it('converts to API and date input values', () => {
    expect(toApiDate('29/07/2026')).toBe('2026-07-29');
    expect(toApiDate('2026-07-29T10:00:00')).toBe('2026-07-29');
    expect(toDateInputValue('29/07/2026')).toBe('2026-07-29');
    expect(toDateInputValue(new Date(2026, 6, 29))).toBe('2026-07-29');
    expect(toApiDate('')).toBe('');
    expect(toApiDate('not-a-date')).toBe('not-a-date');
    expect(parseDateBr('32/01/2026')).toBeNull();
    expect(parseDateBr('2026-02-31')).toBeNull();
  });

  it('handles invalid Date instances', () => {
    expect(formatDateBr(new Date('invalid'))).toBe('');
    expect(toDateInputValue(new Date('invalid'))).toBe('');
  });

  it('returns empty date input for unparseable strings', () => {
    expect(toDateInputValue('not-a-date')).toBe('');
    expect(toDateInputValue(null)).toBe('');
  });
});
