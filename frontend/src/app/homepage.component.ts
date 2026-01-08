import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { FleetService } from './fleet.service';
import { AssetType } from './models/asset-type';
import { ServiceCenter } from './models/service-center';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatNativeDateModule],
  template: `
  template: `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" role="banner">
    <div class="site-header-inner">
      <div class="brand">
        <a href="#" class="brand-link">Fleet<span class="brand-accent">Hub</span></a>
      </div>
      <nav class="site-nav" role="navigation" aria-label="Main navigation">
        <a class="nav-link" href="#">Home</a>
        <a class="nav-link" href="#appointments">Appointments</a>
        <a class="nav-link" href="#docs">Docs</a>
      </nav>
    </div>
  </header>

  <main id="main" class="homepage-root" role="main">
    <div class="hero" aria-hidden="false">
      <div class="hero-inner">
        <h1 class="title">Fleet Service Scheduler</h1>
        <p class="subtitle">Schedule and manage maintenance appointments for your fleet — fast and simple.</p>
      </div>
      <div class="hero-illustration" aria-hidden="true"></div>
    </div>

    <section class="container card" aria-labelledby="schedule-heading">
      <h2 id="schedule-heading" class="sr-only">Schedule an appointment</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid" aria-describedby="form-desc">
        <div id="form-desc" class="sr-only">Choose an asset type, service center and date to schedule a maintenance appointment.</div>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Asset Type</mat-label>
          <select matNativeControl formControlName="assetTypeId" required class="select-input" aria-label="Asset Type">
            <option value="">Select asset</option>
            <option *ngFor="let a of assetTypes" [value]="a.id">{{a.name}}</option>
          </select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field">
          <mat-label>Service Center</mat-label>
          <select matNativeControl formControlName="serviceCenterId" required class="select-input" aria-label="Service Center">
            <option value="">Select center</option>
            <option *ngFor="let s of centers" [value]="s.id">{{s.name}} — {{s.city}}</option>
          </select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field full-width">
          <mat-label>Appointment Date & Time</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="appointmentDateTime" placeholder="Choose a date and time" class="date-input" aria-label="Appointment Date and Time">
          <mat-datepicker-toggle matSuffix [for]="picker" aria-label="Toggle datepicker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="field full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput formControlName="notes" placeholder="Add details about the appointment" aria-label="Notes">
        </mat-form-field>

        <div class="actions">
          <button type="submit" class="btn-primary" [disabled]="form.invalid" aria-disabled="{{form.invalid}}">Save Appointment</button>
        </div>
      </form>

      <p *ngIf="saved" class="success" role="status" aria-live="polite">Appointment saved successfully!</p>
    </section>
  </main>

  <footer class="site-footer" role="contentinfo">
    <div class="site-footer-inner">
      <p>© <span id="year"></span> FleetHub — Built with care.</p>
    </div>
  </footer>
  `
    if (this.form.invalid) return;
    const raw = this.form.value;
    const payload = {
      assetTypeId: Number(raw.assetTypeId),
      serviceCenterId: Number(raw.serviceCenterId),
      appointmentDateTime: (raw.appointmentDateTime as Date).toISOString(),
      notes: raw.notes
    };

    this.fleet.createAppointment(payload).subscribe(() => {
      this.saved = true;
      this.form.reset();
    });
  }
}
