import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const OVERRIDE_KEY = 'fleet_idle_timeout_ms'; // optional localStorage override (ms) for testing

@Injectable({ providedIn: 'root' })
export class IdleService implements OnDestroy {
  private timeoutId: any = null;
  private events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

  constructor(private auth: AuthService, private router: Router) {
    // Start/stop watching based on auth state
    this.auth.authState.subscribe(token => {
      if (token) {
        this.start();
      } else {
        this.stop();
      }
    });

    this.addListeners();
  }

  private addListeners() {
    this.events.forEach(e => window.addEventListener(e, this.resetTimer, true));
  }

  private removeListeners() {
    this.events.forEach(e => window.removeEventListener(e, this.resetTimer, true));
  }

  private getTimeoutMs(): number {
    try {
      const v = localStorage.getItem(OVERRIDE_KEY);
      if (v) {
        const n = parseInt(v, 10);
        if (!Number.isNaN(n) && n > 0) return n;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TIMEOUT_MS;
  }

  private resetTimer = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (!this.auth.isAuthenticated()) return;
    this.timeoutId = setTimeout(() => this.onTimeout(), this.getTimeoutMs());
  };

  private onTimeout() {
    this.stop();
    this.auth.logout();
    try {
      this.router.navigate(['/signin']);
    } catch {
      // router navigation may fail during shutdown; ignore
    }
    // Friendly UX: inform the user
    try { alert('You have been logged out due to 30 minutes of inactivity.'); } catch {}
  }

  start() {
    this.resetTimer();
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
    this.removeListeners();
  }
}
