import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Palestrante } from '../models';

@Injectable({ providedIn: 'root' })
export class PalestranteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/palestrantes`;

  getAll(): Observable<Palestrante[]> {
    return this.http.get<Palestrante[]>(this.baseUrl);
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

  getByNome(nome: string): Observable<Palestrante[]> {
    return this.http.get<Palestrante[]>(`${this.baseUrl}/nome/${encodeURIComponent(nome)}`);
  }

  getByTema(tema: string): Observable<Palestrante[]> {
    return this.http.get<Palestrante[]>(`${this.baseUrl}/tema/${encodeURIComponent(tema)}`);
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
}
