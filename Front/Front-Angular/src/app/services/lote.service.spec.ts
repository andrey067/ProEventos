import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LoteService } from './lote.service';
import { environment } from '../../environments/environment';

describe('LoteService', () => {
  let service: LoteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoteService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch lotes by evento id', () => {
    const mockLotes = [{ id: 1, nome: 'VIP', eventoId: 2 }];

    service.getByEventoId(2).subscribe((lotes) => {
      expect(lotes).toEqual(mockLotes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/lotes/2`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLotes);
  });

  it('should save lotes for evento', () => {
    const lotes = [{ id: 0, nome: 'Early', preco: 50, eventoId: 3 }];

    service.save(3, lotes).subscribe((result) => {
      expect(result).toEqual(lotes);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/lotes/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(lotes);
    req.flush(lotes);
  });

  it('should delete lote by evento and lote id', () => {
    service.delete(3, 9).subscribe((response) => {
      expect(response.message).toBe('Removido');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/lotes/3/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Removido' });
  });
});
