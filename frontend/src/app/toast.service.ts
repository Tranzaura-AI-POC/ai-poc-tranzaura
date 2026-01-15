import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage { id: number; text: string; type?: 'info' | 'error' | 'success' }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private messages$ = new BehaviorSubject<ToastMessage[]>([]);
  public readonly messages = this.messages$.asObservable();
  private nextId = 1;

  show(text: string, type: ToastMessage['type'] = 'info', timeout = 4000) {
    const msg: ToastMessage = { id: this.nextId++, text, type };
    const list = [...this.messages$.value, msg];
    this.messages$.next(list);
    // Debug: log when toasts are shown to help local troubleshooting
    try { console.log('ToastService.show:', type, text); } catch { /* no-op */ }
    if (timeout > 0) {
      setTimeout(() => this.dismiss(msg.id), timeout);
    }
  }

  dismiss(id: number) {
    this.messages$.next(this.messages$.value.filter(m => m.id !== id));
  }
}
