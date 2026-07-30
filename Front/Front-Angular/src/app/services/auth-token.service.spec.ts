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

  it('clears token and roles', () => {
    service.setSession('my-token', ['User']);
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.getRoles()).toEqual([]);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.canWrite()).toBe(false);
  });

  it('canWrite is true only for User role', () => {
    service.setSession('t', ['Palestrante']);
    expect(service.canWrite()).toBe(false);
    service.setSession('t', ['User']);
    expect(service.canWrite()).toBe(true);
    expect(service.hasRole('User')).toBe(true);
  });

  it('returns empty roles for invalid JSON', () => {
    localStorage.setItem('proeventos_roles', 'not-json');
    expect(service.getRoles()).toEqual([]);
  });

  it('clears roles when setRoles receives empty array', () => {
    service.setSession('t', ['User']);
    service.setRoles([]);
    expect(service.getRoles()).toEqual([]);
  });

  it('returns empty roles when parsed JSON is not an array', () => {
    localStorage.setItem('proeventos_roles', JSON.stringify({ role: 'User' }));
    expect(service.getRoles()).toEqual([]);
  });

  it('removes roles when setRoles is null or undefined', () => {
    service.setSession('t', ['User']);
    service.setRoles(null);
    expect(localStorage.getItem('proeventos_roles')).toBeNull();
    service.setSession('t', ['User']);
    service.setRoles(undefined);
    expect(localStorage.getItem('proeventos_roles')).toBeNull();
  });

  it('hasRole returns false for missing role', () => {
    service.setSession('t', ['Palestrante']);
    expect(service.hasRole('Admin')).toBe(false);
  });
});
