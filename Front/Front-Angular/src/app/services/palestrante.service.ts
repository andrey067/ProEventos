import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageResult, Palestrante } from '../models';
import { PAGINATION_HEADER, pageResultFromHeader } from '../models/pagination';

export type PalestranteListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

@Injectable({ providedIn: 'root' })
export class PalestranteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/palestrantes`;

  getAll(params: PalestranteListParams = {}): Observable<PageResult<Palestrante>> {
    return this.http
      .get<Palestrante[]>(this.baseUrl, {
        params: this.toParams(params),
        observe: 'response',
      })
      .pipe(
        map((res) =>
          pageResultFromHeader(
            res.body,
            res.headers.get(PAGINATION_HEADER) ?? res.headers.get('pagination'),
          ),
        ),
      );
  }

  /** Aggregates all pages (for association UIs). */
  listAll(): Observable<Palestrante[]> {
    return this.getAll({ page: 1, pageSize: 30 }).pipe(
      switchMap((first) => {
        if (first.totalPages <= 1) return of(first.items);
        const requests = Array.from({ length: first.totalPages - 1 }, (_, i) =>
          this.getAll({ page: i + 2, pageSize: 30 }),
        );
        return forkJoin(requests).pipe(
          map((pages) => [...first.items, ...pages.flatMap((p) => p.items)]),
        );
      }),
    );
  }

  getById(id: number): Observable<Palestrante> {
    return this.http.get<Palestrante>(`${this.baseUrl}/${id}`);
  }

  create(palestrante: Omit<Palestrante, 'id'>): Observable<Palestrante> {
    return this.http.post<Palestrante>(this.baseUrl, palestrante);
  }

  update(id: number, palestrante: Palestrante): Observable<Palestrante> {
    return this.http.put<Palestrante>(`${this.baseUrl}/${id}`, palestrante);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  getByNome(
    nome: string,
    params: Omit<PalestranteListParams, 'q'> = {},
  ): Observable<PageResult<Palestrante>> {
    return this.getAll({ ...params, q: nome });
  }

  getByTema(
    tema: string,
    params: Omit<PalestranteListParams, 'q'> = {},
  ): Observable<PageResult<Palestrante>> {
    return this.getAll({ ...params, q: tema });
  }

  associate(eventoId: number, palestranteId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${environment.apiUrl}/eventos/${eventoId}/palestrantes/${palestranteId}`,
      {},
    );
  }

  disassociate(eventoId: number, palestranteId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/eventos/${eventoId}/palestrantes/${palestranteId}`,
    );
  }

  private toParams(params: PalestranteListParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize != null) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
    return httpParams;
  }
}
