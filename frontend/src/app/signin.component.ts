import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <section class="container auth-card signin-panel">
    <div class="signin-banner">
      <div class="brand" style="text-align:center">
        <a class="brand-link">Fleet<span class="brand-accent">Hub</span></a>
      </div>
    </div>
  </section>
  <section class="container auth-card">
    <div class="auth-inner">
      <h2 class="auth-title" id="signin-heading">{{ isRegister ? 'Create an account' : 'Sign in to FleetHub' }}</h2>
      <p class="auth-sub">{{ isRegister ? 'Create a local account for development use.' : 'Enter your username and password to continue.' }}</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form" aria-labelledby="signin-heading">
        <label class="input-label" for="username">Username</label>
        <input id="username" class="auth-input" formControlName="username" placeholder="you@example.com" autocomplete="username" required aria-required="true" />

        <label class="input-label" for="password">Password</label>
        <div class="pw-field">
          <input id="password" class="auth-input" [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="Your password" autocomplete="current-password" required aria-required="true" />
          <button type="button" class="pw-toggle" (click)="toggleShowPassword()" aria-label="Toggle password visibility">
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>

        <div *ngIf="isRegister" class="password-strength">
          <label class="input-label" for="confirmPassword">Confirm password</label>
          <div class="pw-field">
            <input id="confirmPassword" class="auth-input" [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="Confirm your password" autocomplete="new-password" required aria-required="true" />
            <button type="button" class="pw-toggle" (click)="toggleShowConfirmPassword()" aria-label="Toggle confirm password visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p *ngIf="form.errors?.passwordsMismatch && (form.get('confirmPassword')?.touched || form.get('confirmPassword')?.dirty)" class="auth-error">Passwords do not match</p>

          <div class="password-strength-meter">
            <div class="strength-bar" aria-hidden="true">
              <div class="strength-fill" [style.width.%]="(calculatePasswordScore(form.get('password')?.value || '') / 4) * 100"></div>
            </div>
            <div class="strength-text">{{ passwordScoreText(calculatePasswordScore(form.get('password')?.value || '')) }}</div>
          </div>
        </div>

        <div class="auth-actions">
          <button type="submit" class="btn-primary" (click)="onSubmit()">{{ isRegister ? 'Create account' : 'Sign in' }}</button>
        </div>
      </form>

      <div *ngIf="error" class="auth-alert" role="alert" aria-live="assertive" (mouseenter)="pauseErrorTimer()" (mouseleave)="resumeErrorTimer()">
        <div class="auth-alert-inner">
          <div class="auth-alert-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.001 7h2v6h-2V7zm0 8h2v2h-2v-2z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8-8-3.582-8-8z" fill="currentColor"/></svg>
          </div>
          <div class="auth-alert-message">{{ error }}</div>
          <button class="auth-alert-close" (click)="clearError()" aria-label="Dismiss message">×</button>
        </div>
      </div>
      <p class="auth-note">For local dev the seeded admin: <strong>admin</strong> / <strong>Password123!</strong></p>

      <p class="auth-note">
        <a class="auth-toggle" (click)="toggleRegister()">{{ isRegister ? 'Back to sign in' : 'Create an account' }}</a>
      </p>
    </div>
  </section>
  `
})
export class SigninComponent {
  isRegister = false;
  showPassword = false;
  showConfirmPassword = false;
  form: FormGroup | any;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.form = this.fb.group({ username: ['', [Validators.required]], password: ['', [Validators.required, Validators.minLength(8)]], confirmPassword: [''] }, { validators: this.passwordsMatch.bind(this) });
  }

  toggleRegister() {
    this.error = null;
    this.isRegister = !this.isRegister;
  }

  toggleShowPassword() { this.showPassword = !this.showPassword; }
  toggleShowConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  submit() {
    this.error = null;
    const v = this.form.value as any;
    this.auth.login(v.username, v.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: any) => {
        // Friendly messages for common statuses
        if (err && err.status === 401) {
          this.showError('Incorrect username or password.');
          return;
        }
        const msg = err?.error?.message || err?.error || err?.message || 'Invalid username or password';
        this.showError(msg);
      }
    });
  }

  submitRegister() {
    this.error = null;
    const v = this.form.value as any;
    if (this.form.invalid) { this.showError('Please fix validation errors'); return; }
    this.auth.register(v.username, v.password).subscribe({
      next: () => {
        // auto-login after successful registration
        this.auth.login(v.username, v.password).subscribe({ next: () => this.router.navigate(['/']), error: (err:any) => this.showError(err?.error || 'Registration succeeded but login failed') });
      },
      error: (err: any) => this.showError(err?.error || 'Registration failed')
    });
  }

  onSubmit() {
    // ensure controls are marked touched so validators run
    try { this.form.markAllAsTouched(); } catch {}
    if (this.form.invalid) {
      // provide helpful validation messages
      const usernameCtrl = this.form.get('username');
      const passwordCtrl = this.form.get('password');
      if (usernameCtrl?.invalid) { this.showError('Please enter your username.'); return; }
      if (passwordCtrl?.invalid) {
        if (passwordCtrl?.errors?.minlength) this.showError('Password must be at least 8 characters.');
        else this.showError('Please enter your password.');
        return;
      }
    }
    if (this.isRegister) {
      this.submitRegister();
    } else {
      this.submit();
    }
  }

  showError(message: string) {
    this.error = message;
    // auto-dismiss after 12s unless user hovers; support pause/resume
    this.clearErrorTimer();
    this._errorTimer = window.setTimeout(() => {
      if (this.error === message) this.clearError();
    }, 12000);
    // ensure UI updates immediately
    try { this.cdr.detectChanges(); } catch {}
  }

  clearError() { this.error = null; }

  // ensure view updates when clearing
  clearErrorImmediate() { this.error = null; try { this.cdr.detectChanges(); } catch {} }

  private _errorTimer: number | null = null;

  clearErrorTimer() {
    if (this._errorTimer) {
      try { clearTimeout(this._errorTimer as any); } catch {}
      this._errorTimer = null;
    }
  }

  pauseErrorTimer() {
    // stop auto-dismiss while hovered
    this.clearErrorTimer();
  }

  resumeErrorTimer() {
    // resume with a short timeout so it doesn't linger forever
    if (this.error && !this._errorTimer) {
      this._errorTimer = setTimeout(() => this.clearError(), 6000) as unknown as number;
    }
  }

  passwordsMatch(g: FormGroup) {
    if (!this.isRegister) return null;
    const p = g.get('password')?.value;
    const c = g.get('confirmPassword')?.value;
    return p === c ? null : { passwordsMismatch: true };
  }

  calculatePasswordScore(p: string): number {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  passwordScoreText(s: number): string {
    return ['Very weak','Weak','Fair','Good','Strong'][s] || '';
  }
}
