import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthTokenService } from '../services/auth-token.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthTokenService,
          useValue: { getToken: vi.fn(() => null) },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('forwards request unchanged when token is absent', () => {
    http.get('/api/ping').subscribe();
    const req = httpMock.expectOne('/api/ping');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('adds Authorization header when token exists', () => {
    const auth = TestBed.inject(AuthTokenService);
    vi.mocked(auth.getToken).mockReturnValue('jwt-token');

    http.get('/api/secure').subscribe();
    const req = httpMock.expectOne('/api/secure');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });
});
