import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  ChangePassword,
  UserLogin,
  UserProfile,
  UserRegister,
  UserUpdate,
} from '../models';
import { AuthTokenService } from './auth-token.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly authToken = inject(AuthTokenService);
  private readonly baseUrl = `${environment.apiUrl}/account`;

  register(data: UserRegister): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, data).pipe(
      tap((response) => this.authToken.setToken(response.token)),
    );
  }

  login(data: UserLogin): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((response) => this.authToken.setToken(response.token)),
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(data: UserUpdate): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, data);
  }

  changePassword(data: ChangePassword): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/change-password`, data);
  }

  logout(): void {
    this.authToken.clearToken();
  }
}
