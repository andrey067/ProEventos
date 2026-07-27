import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Evento } from '../models';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/eventos`;

  getAll(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.baseUrl);
  }

  getById(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.baseUrl}/${id}`);
  }

  getByTema(tema: string): Observable<Evento[]> {
    return this.http.get<Evento[]>(`${this.baseUrl}/tema/${encodeURIComponent(tema)}`);
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
}
