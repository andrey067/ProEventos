import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthTokenService } from '../services/auth-token.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function setup(isAuthenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthTokenService,
          useValue: {
            isAuthenticated: vi.fn(() => isAuthenticated),
          },
        },
      ],
    });
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows authenticated users', () => {
    setup(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/eventos/new' } as never),
    );

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to /login with returnUrl query', () => {
    setup(false);
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/eventos/5' } as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login?returnUrl=%2Feventos%2F5');
    expect(tree.queryParams['returnUrl']).toBe('/eventos/5');
  });
});
