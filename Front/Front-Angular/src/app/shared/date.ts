function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isValidDateParts(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

export function formatDateBr(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`;
  }

  const parsed = parseDateBr(value);
  if (parsed) {
    return `${pad2(parsed.getDate())}/${pad2(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
  }

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return `${pad2(fallback.getDate())}/${pad2(fallback.getMonth() + 1)}/${fallback.getFullYear()}`;
  }

  return value;
}

export function parseDateBr(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // API often returns "dd/MM/yyyy HH:mm:ss" — accept optional time suffix.
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/);
  if (brMatch) {
    const day = Number(brMatch[1]);
    const month = Number(brMatch[2]);
    const year = Number(brMatch[3]);
    if (!isValidDateParts(day, month, year)) return null;
    return new Date(year, month - 1, day);
  }

  const legacyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/);
  if (legacyMatch) {
    const day = Number(legacyMatch[1]);
    const month = Number(legacyMatch[2]);
    const year = Number(legacyMatch[3]);
    if (!isValidDateParts(day, month, year)) return null;
    return new Date(year, month - 1, day);
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidDateParts(day, month, year)) return null;
    return new Date(year, month - 1, day);
  }

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso;

  return null;
}

export function toApiDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const parsed = parseDateBr(trimmed);
  if (parsed) return toDateInputValue(parsed);

  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) return toDateInputValue(fallback);

  return trimmed;
}

/** Value for `<input type="date">` (yyyy-MM-dd). */
export function toDateInputValue(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = parseDateBr(trimmed);
  if (parsed) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return '';
}
