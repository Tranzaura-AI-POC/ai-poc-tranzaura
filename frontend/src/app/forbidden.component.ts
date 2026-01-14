import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="forbidden-page">
    <div class="forbidden-card">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this resource.</p>
      <p class="muted">Contact an administrator if you believe this is incorrect.</p>
      <div class="forbidden-actions">
        <button class="btn" (click)="goHome()">Go Home</button>
        <button class="btn btn-secondary" *ngIf="auth.isAuthenticated()" (click)="signOut()">Sign Out</button>
      </div>
    </div>
  </section>
  `,
})
export class ForbiddenComponent {
  constructor(public auth: AuthService, private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  signOut() {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
