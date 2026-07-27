import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { RedeSocialService } from './rede-social.service';
import { environment } from '../../environments/environment';

describe('RedeSocialService', () => {
  let service: RedeSocialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RedeSocialService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RedeSocialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch redes by evento id', () => {
    const mock = [{ id: 1, nome: 'Twitter', url: 'https://x.com', eventoId: 7 }];

    service.getByEventoId(7).subscribe((data) => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/7`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should save redes by evento id', () => {
    const redes = [{ id: 0, nome: 'LinkedIn', url: 'https://linkedin.com', eventoId: 8 }];

    service.saveByEventoId(8, redes).subscribe((data) => {
      expect(data).toEqual(redes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/8`);
    expect(req.request.method).toBe('PUT');
    req.flush(redes);
  });

  it('should delete rede by evento and rede id', () => {
    service.deleteByEventoId(8, 12).subscribe((response) => {
      expect(response.message).toBe('Removida');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/redes-sociais/evento/8/12`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Removida' });
  });
});
