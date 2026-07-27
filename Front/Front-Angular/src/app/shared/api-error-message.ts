export function apiErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    for (const key of ['description', 'detail', 'message'] as const) {
      const v = o[key];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return fallback;
}
