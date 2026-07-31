import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PalestranteService } from './palestrante.service';
import { environment } from '../../environments/environment';
import { PAGINATION_HEADER } from '../models/pagination';

const pageResult = {
  items: [{ id: 1, nome: 'Ana' }],
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

  it('should fetch paged palestrantes from array + Pagination header', () => {
    service.getAll({ page: 1, pageSize: 10 }).subscribe((data) => {
      expect(data).toEqual(pageResult);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
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

  it('should fetch current user palestrante via getMe', () => {
    const mock = {
      id: 9,
      nome: 'Eu',
      miniCurriculo: 'Bio',
      imagemURL: '',
      telefone: '11',
      email: 'eu@x.com',
    };

    service.getMe().subscribe((data) => {
      expect(data).toEqual(mock);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/palestrantes/me`);
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

  it('should fetch palestrantes by q query', () => {
    service.getAll({ q: 'Ana' }).subscribe((data) => {
      expect(data.items[0].nome).toBe('Ana');
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('q') === 'Ana',
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });

  it('should map getByNome to q query param', () => {
    service.getByNome('Ana').subscribe((data) => {
      expect(data.items[0].nome).toBe('Ana');
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('q') === 'Ana',
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });

  it('should associate palestrante to evento', () => {
    service.associate(10, 3).subscribe((response) => {
      expect(response.message).toBe('Ok');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/10/palestrantes/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Ok' });
  });

  it('should disassociate palestrante from evento', () => {
    service.disassociate(10, 3).subscribe((response) => {
      expect(response.message).toBe('Ok');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/eventos/10/palestrantes/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Ok' });
  });

  it('should list all palestrantes across pages', () => {
    const header1 = JSON.stringify({
      currentPage: 1,
      itemsPerPage: 30,
      totalItems: 2,
      totalPages: 2,
    });
    const header2 = JSON.stringify({
      currentPage: 2,
      itemsPerPage: 30,
      totalItems: 2,
      totalPages: 2,
    });

    service.listAll().subscribe((items) => {
      expect(items).toHaveLength(2);
    });

    const req1 = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '30',
    );
    req1.flush([{ id: 1, nome: 'A' }], { headers: { [PAGINATION_HEADER]: header1 } });

    const req2 = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('page') === '2',
    );
    req2.flush([{ id: 2, nome: 'B' }], { headers: { [PAGINATION_HEADER]: header2 } });
  });

  it('uses lowercase pagination header fallback', () => {
    service.getAll({ page: 1, pageSize: 10 }).subscribe((result) => {
      expect(result.items).toHaveLength(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '10',
    );
    req.flush([{ id: 1, nome: 'Ana' }], {
      headers: { pagination: paginationHeader },
    });
  });

  it('omits empty q from query params', () => {
    service.getAll({ page: 1, pageSize: 10, q: '   ' }).subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('q') == null,
    );
    req.flush([], { headers: { [PAGINATION_HEADER]: paginationHeader } });
  });

  it('should map getByTema to q query param', () => {
    service.getByTema('Workshop').subscribe();

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('q') === 'Workshop',
    );
    req.flush(pageResult.items, {
      headers: { [PAGINATION_HEADER]: paginationHeader },
    });
  });

  it('listAll returns single page without extra requests', () => {
    service.listAll().subscribe((items) => {
      expect(items).toHaveLength(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/palestrantes` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '30',
    );
    req.flush([{ id: 1, nome: 'Solo' }], {
      headers: {
        [PAGINATION_HEADER]: JSON.stringify({
          currentPage: 1,
          itemsPerPage: 30,
          totalItems: 1,
          totalPages: 1,
        }),
      },
    });
  });
});
