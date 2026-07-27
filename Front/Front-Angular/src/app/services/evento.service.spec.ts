import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EventoService } from './evento.service';
import { environment } from '../../environments/environment';

describe('EventoService', () => {
  let service: EventoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(EventoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch all eventos', () => {
    const mockEventos = [{ id: 1, tema: 'Workshop Angular' }];

    service.getAll().subscribe((eventos) => {
      expect(eventos).toEqual(mockEventos);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEventos);
  });

  it('should search eventos by tema', () => {
    service.getByTema('vue').subscribe((eventos) => {
      expect(eventos).toEqual([]);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/tema/vue`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should delete evento by id', () => {
    service.delete(3).subscribe((response) => {
      expect(response.message).toBe('Deletado');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deletado' });
  });

  it('should fetch evento by id', () => {
    const mock = { id: 4, tema: 'Summit' };

    service.getById(4).subscribe((evento) => {
      expect(evento).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/4`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should create evento', () => {
    const payload = { tema: 'Novo', local: 'SP', dataEvento: '01-01-2026', qtdPessoas: 10, imagemURL: '', telefone: '11', email: 'a@b.com' };
    const created = { id: 5, ...payload };

    service.create(payload).subscribe((evento) => {
      expect(evento).toEqual(created);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });

  it('should update evento', () => {
    const updated = { id: 6, tema: 'Atualizado', local: 'RJ', dataEvento: '02-02-2026', qtdPessoas: 20, imagemURL: '', telefone: '21', email: 'c@d.com' };

    service.update(6, updated).subscribe((evento) => {
      expect(evento).toEqual(updated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/6`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });
});
