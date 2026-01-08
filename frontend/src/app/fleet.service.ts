import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const API_BASE = 'http://127.0.0.1:5000/api';

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

  createAppointment(payload: any) {
    return this.http.post(`${API_BASE}/ServiceAppointments`, payload);
  }
}
