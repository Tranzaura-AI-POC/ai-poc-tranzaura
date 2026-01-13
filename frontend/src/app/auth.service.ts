import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const API_BASE = 'http://127.0.0.1:5000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'fleet_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${API_BASE}/Auth/login`, { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
        }
      })
    );
  }

  register(username: string, password: string, role?: string) {
    return this.http.post<any>(`${API_BASE}/Auth/register`, { username, password, role });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
