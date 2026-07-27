import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PalestranteService } from './palestrante.service';
import { environment } from '../../environments/environment';

describe('PalestranteService', () => {
  let service: PalestranteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PalestranteService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PalestranteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all palestrantes', () => {
    const mock = [{ id: 1, nome: 'Ana' }];

    service.getAll().subscribe((data) => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should fetch palestrante by id', () => {
    const mock = { id: 2, nome: 'Bruno' };

    service.getById(2).subscribe((data) => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/2`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should create palestrante', () => {
    const payload = { nome: 'Carla', miniCurriculo: '', imagemURL: '', telefone: '', email: '' };
    const created = { id: 3, ...payload };

    service.create(payload).subscribe((data) => {
      expect(data).toEqual(created);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes`);
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });

  it('should update palestrante', () => {
    const updated = { id: 4, nome: 'Diego', miniCurriculo: '', imagemURL: '', telefone: '', email: '' };

    service.update(4, updated).subscribe((data) => {
      expect(data).toEqual(updated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/4`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('should delete palestrante', () => {
    service.delete(5).subscribe((response) => {
      expect(response.message).toBe('Ok');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Ok' });
  });
});
