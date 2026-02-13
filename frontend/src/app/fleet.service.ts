import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { API_BASE } from './runtime-api';

console.log('FleetService: resolved API_BASE =', API_BASE);

@Injectable({ providedIn: 'root' })
export class FleetService {
  constructor(private http: HttpClient) {}

  getAssetTypes(): Observable<any[]> {
    const url = `${API_BASE}/AssetTypes`;
    console.log('FleetService: GET', url);
    return this.http.get<any[]>(url).pipe(
      tap(res => console.log('FleetService: AssetTypes response', res)),
      catchError((err) => {
        console.error('Failed to load asset types', err);
        return of([] as any[]);
      })
    );
  }

  getServiceCenters(): Observable<any[]> {
    const url = `${API_BASE}/ServiceCenters`;
    console.log('FleetService: GET', url);
    return this.http.get<any[]>(url).pipe(
      tap(res => console.log('FleetService: ServiceCenters response', res)),
      catchError((err) => {
        console.error('Failed to load service centers', err);
        return of([] as any[]);
      })
    );
  }

  getAppointments(): Observable<any[]> {
    const url = `${API_BASE}/ServiceAppointments`;
    console.log('FleetService: GET', url);
    return this.http.get<any[]>(url).pipe(
      tap(res => console.log('FleetService: Appointments response', res)),
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
