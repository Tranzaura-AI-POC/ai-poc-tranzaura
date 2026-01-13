import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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

      <form [formGroup]="form" (ngSubmit)="isRegister ? submitRegister() : submit()" class="auth-form" aria-labelledby="signin-heading">
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
          <button type="submit" class="btn-primary" [disabled]="form.invalid">{{ isRegister ? 'Create account' : 'Sign in' }}</button>
        </div>
      </form>

      <p *ngIf="error" class="auth-error" role="alert">{{ error }}</p>
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

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

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
      error: () => this.error = 'Login failed'
    });
  }

  submitRegister() {
    this.error = null;
    const v = this.form.value as any;
    if (this.form.invalid) { this.error = 'Please fix validation errors'; return; }
    this.auth.register(v.username, v.password).subscribe({
      next: () => {
        // auto-login after successful registration
        this.auth.login(v.username, v.password).subscribe({ next: () => this.router.navigate(['/']), error: () => this.error = 'Registration succeeded but login failed' });
      },
      error: () => this.error = 'Registration failed'
    });
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
