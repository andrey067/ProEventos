const TOKEN_KEY = "proeventos_token";
const ROLES_KEY = "proeventos_roles";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRoles(): string[] {
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return [];
  }
}

export function setRoles(roles: string[] | undefined | null): void {
  if (!roles?.length) {
    localStorage.removeItem(ROLES_KEY);
    return;
  }
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function setSession(token: string, roles?: string[] | null): void {
  setToken(token);
  setRoles(roles);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLES_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/** Organizer role — create/edit/delete. Palestrante is read-only. */
export function canWrite(): boolean {
  return getRoles().includes("User");
}

export function hasRole(role: string): boolean {
  return getRoles().includes(role);
}
