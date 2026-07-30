import { Injectable } from '@angular/core';

const STORAGE_KEY = 'proeventos_token';
const ROLES_KEY = 'proeventos_roles';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  }

  getRoles(): string[] {
    try {
      const raw = localStorage.getItem(ROLES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((r): r is string => typeof r === 'string')
        : [];
    } catch {
      return [];
    }
  }

  setRoles(roles: string[] | undefined | null): void {
    if (!roles?.length) {
      localStorage.removeItem(ROLES_KEY);
      return;
    }
    localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
  }

  setSession(token: string, roles?: string[] | null): void {
    this.setToken(token);
    this.setRoles(roles);
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ROLES_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Organizer role — create/edit/delete. Palestrante is read-only. */
  canWrite(): boolean {
    return this.getRoles().includes('User');
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }
}
