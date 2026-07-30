function parseIsoDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, yyyy, mm, dd] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  return date;
}

function parseLegacyDate(value: string): Date | null {
  // API may append " HH:mm:ss"
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  return date;
}

export function parseDateBr(value: string): Date | null {
  // API often returns "dd/MM/yyyy HH:mm:ss" — accept optional time suffix.
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}(?::\d{2})?)?$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  return date;
}

function parseDateInput(value: string): Date | null {
  return parseDateBr(value) ?? parseIsoDate(value) ?? parseLegacyDate(value);
}

export function formatDateBr(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : parseDateInput(value);
  if (!date || Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function toApiDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const date = parseDateInput(trimmed);
  if (!date || Number.isNaN(date.getTime())) {
    return trimmed;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Value for `<input type="date">` (yyyy-MM-dd). */
export function toDateInputValue(
  value: string | Date | null | undefined,
): string {
  if (value == null || value === "") return "";
  return toApiDate(value).slice(0, 10);
}

export function parseLoteDate(value: string): Date | null {
  return parseDateBr(value) ?? parseIsoDate(value) ?? parseLegacyDate(value);
}
