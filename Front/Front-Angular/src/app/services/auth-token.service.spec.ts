import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    localStorage.clear();
    service = new AuthTokenService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists token in localStorage', () => {
    service.setToken('my-token');
    expect(localStorage.getItem('proeventos_token')).toBe('my-token');
    expect(service.getToken()).toBe('my-token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears token', () => {
    service.setToken('my-token');
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
