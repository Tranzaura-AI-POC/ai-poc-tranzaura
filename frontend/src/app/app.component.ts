import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HomepageComponent } from './homepage.component';
import { AppointmentsComponent } from './appointments.component';
import { AuthService } from './auth.service';
import { ToastComponent } from './toast.component';
import { AdminOnlyDirective } from './admin-only.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HomepageComponent, AppointmentsComponent, ToastComponent, AdminOnlyDirective],
  template: `
  <a class="skip-link" href="#main">Skip to content</a>
  <header *ngIf="auth.isAuthenticated()" class="site-header" role="banner">
    <div class="site-header-inner">
      <div class="brand">
        <a routerLink="/" class="brand-link">Fleet<span class="brand-accent">Hub</span></a>
      </div>
      <nav class="site-nav" role="navigation" aria-label="Main navigation">
        <a class="nav-link" routerLink="/">Home</a>
        <a class="nav-link" routerLink="/appointments">Appointments</a>
        <a *appIfAdmin class="nav-link" routerLink="/docs">Docs</a>
        <a *ngIf="!auth.isAuthenticated()" class="nav-link" routerLink="/signin">Sign In</a>
        <a *ngIf="auth.isAuthenticated()" class="nav-link signout" (click)="signOut()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" style="vertical-align:middle;margin-right:8px;filter:brightness(0) invert(1);">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor"/>
          </svg>
          Sign Out
        </a>
      </nav>
    </div>
  </header>
  <main id="main">
    <router-outlet></router-outlet>
  </main>

  <app-toast></app-toast>

  <footer class="site-footer" role="contentinfo">
    <div class="site-footer-inner">
      <p>© {{ year }} FleetHub — Built with care.</p>
    </div>
  </footer>
  `
})
export class AppComponent {
  year = new Date().getFullYear();
  constructor(public auth: AuthService, private router: Router) {}

  signOut() {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}
