import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { API_BASE } from './runtime-api';

@Injectable({ providedIn: 'root' })
export class FleetService {
  constructor(private http: HttpClient) {}

  getAssetTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/AssetTypes`).pipe(
      catchError((err) => {
        console.error('Failed to load asset types', err);
        return of([] as any[]);
      })
    );
  }

  getServiceCenters(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/ServiceCenters`).pipe(
      catchError((err) => {
        console.error('Failed to load service centers', err);
        return of([] as any[]);
      })
    );
  }

  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/ServiceAppointments`).pipe(
      catchError((err) => {
        console.error('Failed to load appointments', err);
        return of([] as any[]);
      })
    );
  }

  createAppointment(payload: any) {
    return this.http.post(`${API_BASE}/ServiceAppointments`, payload);
  }

  updateAppointment(id: number, payload: any) {
    return this.http.put(`${API_BASE}/ServiceAppointments/${id}`, payload);
  }

  deleteAppointment(id: number) {
    return this.http.delete(`${API_BASE}/ServiceAppointments/${id}`);
  }
}
