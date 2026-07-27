import { Injectable } from '@angular/core';

const STORAGE_KEY = 'proeventos_token';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
