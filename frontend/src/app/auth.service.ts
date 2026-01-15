import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'fleet_token';
  private authState$ = new BehaviorSubject<string | null>(this.getToken());
  public readonly authState = this.authState$.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<any>(`${API_BASE}/Auth/login`, { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          localStorage.setItem(this.tokenKey, res.token);
          this.authState$.next(res.token);
        }
      })
    );
  }

  register(username: string, password: string, role?: string) {
    return this.http.post<any>(`${API_BASE}/Auth/register`, { username, password, role });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.authState$.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Decode JWT payload (safe for non-sensitive client-side checks)
  private parseJwt(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch {
      return null;
    }
  }

  getUserRoles(): string[] {
    const t = this.getToken();
    if (!t) return [];
    const payload = this.parseJwt(t);
    if (!payload) return [];
    // Common role claim names: 'role', 'roles', or 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const roleClaim = payload['roles'] || payload['role'] || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (!roleClaim) return [];
    return Array.isArray(roleClaim) ? roleClaim : [String(roleClaim)];
  }

  hasRole(expected: string): boolean {
    const roles = this.getUserRoles();
    return roles.some(r => r.toLowerCase() === expected.toLowerCase());
  }
}
