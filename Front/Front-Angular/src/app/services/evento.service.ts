import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Evento, PageResult } from '../models';
import { PAGINATION_HEADER, pageResultFromHeader } from '../models/pagination';

export type EventoListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/eventos`;

  getAll(params: EventoListParams = {}): Observable<PageResult<Evento>> {
    return this.http
      .get<Evento[]>(this.baseUrl, {
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

  getById(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.baseUrl}/${id}`);
  }

  getByTema(
    tema: string,
    params: Omit<EventoListParams, 'q'> = {},
  ): Observable<PageResult<Evento>> {
    return this.getAll({ ...params, q: tema });
  }

  create(evento: Omit<Evento, 'id'>): Observable<Evento> {
    return this.http.post<Evento>(this.baseUrl, evento);
  }

  update(id: number, evento: Evento): Observable<Evento> {
    return this.http.put<Evento>(`${this.baseUrl}/${id}`, evento);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  private toParams(params: EventoListParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.pageSize != null) httpParams = httpParams.set('pageSize', String(params.pageSize));
    if (params.q?.trim()) httpParams = httpParams.set('q', params.q.trim());
    return httpParams;
  }
}
