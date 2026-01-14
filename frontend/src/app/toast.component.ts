import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toast-wrap" aria-live="polite" aria-atomic="true">
    <div *ngFor="let m of msgs" class="toast" [ngClass]="m.type">
      <div class="toast-body">{{ m.text }}</div>
      <button class="toast-close" (click)="dismiss(m.id)">×</button>
    </div>
  </div>
  `
})
export class ToastComponent {
  msgs: ToastMessage[] = [];
  private svc = inject(ToastService);

  constructor() {
    this.svc.messages.subscribe(m => this.msgs = m);
  }

  dismiss(id: number) { this.svc.dismiss(id); }
}
