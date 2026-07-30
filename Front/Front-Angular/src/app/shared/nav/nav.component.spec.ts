import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavComponent } from './nav.component';
import { AuthTokenService } from '../../services/auth-token.service';
import { AccountService } from '../../services/account.service';

describe('NavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthTokenService,
          useValue: { isAuthenticated: vi.fn(() => false) },
        },
        {
          provide: AccountService,
          useValue: { logout: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  it('should render navigation links for guests', () => {
    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ProEventos');
    expect(compiled.textContent).toContain('Eventos');
    expect(compiled.textContent).toContain('Palestrantes');
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).toContain('Cadastro');
  });

  it('should render session links when authenticated', () => {
    const authToken = TestBed.inject(AuthTokenService);
    vi.mocked(authToken.isAuthenticated).mockReturnValue(true);

    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Perfil');
    expect(compiled.textContent).toContain('Sair');
  });

  it('should toggle mobile menu', () => {
    const fixture = TestBed.createComponent(NavComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.menuOpen).toBe(false);
    component.toggleMenu();
    expect(component.menuOpen).toBe(true);
    component.closeMenu();
    expect(component.menuOpen).toBe(false);
  });

  it('should logout and navigate to login', () => {
    const authToken = TestBed.inject(AuthTokenService);
    vi.mocked(authToken.isAuthenticated).mockReturnValue(true);
    const account = TestBed.inject(AccountService);
    const router = TestBed.inject(Router);
    const logoutSpy = vi.spyOn(account, 'logout');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    fixture.componentInstance.logout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('closes mobile menu after navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([
          { path: 'eventos', component: class StubComponent {} },
          { path: 'palestrantes', component: class StubComponent {} },
        ]),
        {
          provide: AuthTokenService,
          useValue: { isAuthenticated: vi.fn(() => false) },
        },
        {
          provide: AccountService,
          useValue: { logout: vi.fn() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    fixture.componentInstance.toggleMenu();
    expect(fixture.componentInstance.menuOpen).toBe(true);

    await router.navigateByUrl('/palestrantes');
    fixture.detectChanges();

    expect(fixture.componentInstance.menuOpen).toBe(false);
  });

  it('renders mobile nav and toggles menu icon', () => {
    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const menuButton = root.querySelector('button[aria-controls="mobile-nav"]') as HTMLButtonElement;

    expect(root.querySelector('#mobile-nav')).toBeNull();
    expect(menuButton.getAttribute('aria-label')).toBe('Abrir menu');

    menuButton.click();
    fixture.detectChanges();

    expect(root.querySelector('#mobile-nav')).not.toBeNull();
    expect(menuButton.getAttribute('aria-label')).toBe('Fechar menu');
  });
});
