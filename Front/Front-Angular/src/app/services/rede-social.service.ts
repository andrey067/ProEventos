import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RedeSocial } from '../models';

@Injectable({ providedIn: 'root' })
export class RedeSocialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/redes-sociais`;

  getByEventoId(eventoId: number): Observable<RedeSocial[]> {
    return this.http.get<RedeSocial[]>(`${this.baseUrl}/evento/${eventoId}`);
  }

  saveByEventoId(eventoId: number, redes: RedeSocial[]): Observable<RedeSocial[]> {
    return this.http.put<RedeSocial[]>(`${this.baseUrl}/evento/${eventoId}`, redes);
  }

  deleteByEventoId(eventoId: number, redeSocialId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/evento/${eventoId}/${redeSocialId}`,
    );
  }

  getByPalestranteId(palestranteId: number): Observable<RedeSocial[]> {
    return this.http.get<RedeSocial[]>(`${this.baseUrl}/palestrante/${palestranteId}`);
  }

  saveByPalestranteId(
    palestranteId: number,
    redes: RedeSocial[],
  ): Observable<RedeSocial[]> {
    return this.http.put<RedeSocial[]>(
      `${this.baseUrl}/palestrante/${palestranteId}`,
      redes,
    );
  }

  deleteByPalestranteId(
    palestranteId: number,
    redeSocialId: number,
  ): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/palestrante/${palestranteId}/${redeSocialId}`,
    );
  }

  getMine(): Observable<RedeSocial[]> {
    return this.http.get<RedeSocial[]>(`${this.baseUrl}/palestrante`);
  }

  saveMine(redes: RedeSocial[]): Observable<RedeSocial[]> {
    return this.http.put<RedeSocial[]>(`${this.baseUrl}/palestrante`, redes);
  }

  deleteMine(redeSocialId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/palestrante/${redeSocialId}`,
    );
  }
}
