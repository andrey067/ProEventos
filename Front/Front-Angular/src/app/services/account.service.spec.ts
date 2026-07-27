import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AccountService } from './account.service';
import { AuthTokenService } from './auth-token.service';
import { environment } from '../../environments/environment';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;
  let authToken: AuthTokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AccountService, AuthTokenService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
    authToken = TestBed.inject(AuthTokenService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('stores token on login', () => {
    service.login({ userName: 'u', password: 'p' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/account/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'abc', userName: 'u', email: 'a@b.com', nome: 'Nome' });

    expect(authToken.getToken()).toBe('abc');
  });

  it('stores token on register', () => {
    service
      .register({ nome: 'N', userName: 'u', email: 'a@b.com', password: 'p' })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/account/register`);
    req.flush({ token: 'xyz', userName: 'u', email: 'a@b.com', nome: 'N' });

    expect(authToken.getToken()).toBe('xyz');
  });

  it('fetches profile', () => {
    service.getProfile().subscribe((profile) => {
      expect(profile.userName).toBe('u');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/account/profile`);
    expect(req.request.method).toBe('GET');
    req.flush({ userName: 'u', email: 'a@b.com', nome: 'Nome' });
  });

  it('clears token on logout', () => {
    authToken.setToken('t');
    service.logout();
    expect(authToken.getToken()).toBeNull();
  });
});
