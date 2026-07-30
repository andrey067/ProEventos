import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EventoService } from './evento.service';
import { environment } from '../../environments/environment';
import { PAGINATION_HEADER } from '../models/pagination';

const pageResult = {
  items: [{ id: 1, tema: 'Workshop Angular' }],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

const paginationHeader = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 1,
  totalPages: 1,
});

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

  it('should fetch paged eventos from array + Pagination header', () => {
    service.getAll({ page: 1, pageSize: 10 }).subscribe((result) => {
      expect(result).toEqual(pageResult);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/eventos` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });

  it('should search eventos by q query', () => {
    service.getAll({ page: 1, pageSize: 10, q: 'vue' }).subscribe((result) => {
      expect(result.items).toEqual([]);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/eventos` &&
        r.params.get('q') === 'vue',
    );
    expect(req.request.method).toBe('GET');
    req.flush([], {
      headers: {
        [PAGINATION_HEADER]: JSON.stringify({
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
          totalPages: 0,
        }),
      },
    });
  });

  it('should map getByTema to q query param', () => {
    service.getByTema('vue', { page: 1, pageSize: 10 }).subscribe((result) => {
      expect(result.items).toEqual([]);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/eventos` &&
        r.params.get('q') === 'vue',
    );
    expect(req.request.method).toBe('GET');
    req.flush([], {
      headers: {
        [PAGINATION_HEADER]: JSON.stringify({
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 0,
          totalPages: 0,
        }),
      },
    });
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
    const payload = {
      tema: 'Novo',
      local: 'SP',
      dataEvento: '01-01-2026',
      qtdPessoas: 10,
      imagemURL: '',
      telefone: '11',
      email: 'a@b.com',
    };
    const created = { id: 5, ...payload };

    service.create(payload).subscribe((evento) => {
      expect(evento).toEqual(created);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    expect(req.request.method).toBe('POST');
    req.flush(created);
  });

  it('should update evento', () => {
    const updated = {
      id: 6,
      tema: 'Atualizado',
      local: 'RJ',
      dataEvento: '02-02-2026',
      qtdPessoas: 20,
      imagemURL: '',
      telefone: '21',
      email: 'c@d.com',
    };

    service.update(6, updated).subscribe((evento) => {
      expect(evento).toEqual(updated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/6`);
    expect(req.request.method).toBe('PUT');
    req.flush(updated);
  });

  it('uses lowercase pagination header fallback', () => {
    service.getAll({ page: 1, pageSize: 10 }).subscribe((result) => {
      expect(result).toEqual(pageResult);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/eventos` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '10',
    );
    req.flush(pageResult.items, {
      headers: { pagination: paginationHeader },
    });
  });

  it('omits empty q from query params', () => {
    service.getAll({ page: 1, pageSize: 10, q: '   ' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/eventos` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '10' &&
        r.params.get('q') == null,
    );
    req.flush([], {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });

  it('fetches with default empty params', () => {
    service.getAll().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos`);
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });
});
