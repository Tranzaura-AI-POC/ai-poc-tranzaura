import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FleetService } from './fleet.service';
import { AssetType } from './models/asset-type';
import { ServiceCenter } from './models/service-center';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
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
        <p id="form-desc" class="form-desc">Choose an asset type, service center and date to schedule a maintenance appointment.</p>

        <div class="field">
          <label class="input-label">Asset Type</label>
          <div class="select-wrapper">
            <input [value]="assetTypeInput" class="select-input" placeholder="Start typing to search" (input)="assetTypeInput=$any($event.target).value; filterAssetTypes(assetTypeInput); onAssetTypeInput(assetTypeInput)" aria-label="Asset Type">
            <button type="button" class="select-toggle" (click)="toggleAssetTypeList()" aria-label="Toggle asset type list">▾</button>
            <div *ngIf="showAssetTypeList" class="options-list">
              <div *ngFor="let a of assetTypesFiltered" class="option-item" (click)="selectAssetType(a.name)">{{ a.name }}</div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="input-label">Asset Make</label>
          <div class="select-wrapper">
            <input [value]="makeInput" class="select-input" placeholder="Start typing to search" (input)="makeInput=$any($event.target).value; filterMakes(makeInput);" aria-label="Asset Make">
            <button type="button" class="select-toggle" (click)="toggleMakeList()" aria-label="Toggle makes list">▾</button>
            <div *ngIf="showMakeList" class="options-list">
              <div *ngFor="let m of assetMakesFiltered" class="option-item" (click)="selectMake(m)">{{ m }}</div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="input-label">Service Center</label>
          <div class="select-wrapper">
            <input [value]="centerInput" class="select-input" placeholder="Start typing to search" (input)="centerInput=$any($event.target).value; filterCenters(centerInput); onServiceCenterInput(centerInput)" aria-label="Service Center">
            <button type="button" class="select-toggle" (click)="toggleCenterList()" aria-label="Toggle centers list">▾</button>
            <div *ngIf="showCenterList" class="options-list">
              <div *ngFor="let s of centersFiltered" class="option-item" (click)="selectServiceCenter(s.name + ' — ' + s.city)">{{ s.name }} — {{ s.city }}</div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="input-label">Asset Year</label>
          <div class="select-wrapper">
            <input [value]="yearInput" class="select-input" placeholder="Start typing to filter" (input)="yearInput=$any($event.target).value; filterYears(yearInput)" aria-label="Asset Year">
            <button type="button" class="select-toggle" (click)="toggleYearList()" aria-label="Toggle years list">▾</button>
            <div *ngIf="showYearList" class="options-list">
              <div *ngFor="let y of assetYearsFiltered" class="option-item" (click)="selectYear(y)">{{ y }}</div>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="input-label">Appointment Date</label>
          <input type="date" formControlName="appointmentDate" class="date-input" aria-label="Appointment Date">
        </div>

        <div class="field">
          <label class="input-label">Appointment Time</label>
          <input type="time" formControlName="appointmentTime" class="date-input" aria-label="Appointment Time">
        </div>

        <div class="field full-width">
          <label class="input-label">Notes (optional)</label>
          <textarea formControlName="notes" class="date-input" rows="3" placeholder="Add details about the appointment" aria-label="Notes"></textarea>
        </div>

        <div class="actions">
          <button type="submit" class="btn-primary" [disabled]="form.invalid" [attr.aria-disabled]="form.invalid">Save Appointment</button>
        </div>
      </form>

      <p *ngIf="saved" class="success" role="status" aria-live="polite">Appointment saved successfully!</p>
    </section>

    <!-- Appointments moved to its own route -->
  </main>
  `
})
export class HomepageComponent implements OnInit {
  form: FormGroup;
  assetTypes: AssetType[] = [];
  centers: ServiceCenter[] = [];
  assetYears: number[] = [];
  assetMakes: string[] = [];
  // filtered arrays shown in the dropdowns (support search)
  assetTypesFiltered: AssetType[] = [];
  centersFiltered: ServiceCenter[] = [];
  assetMakesFiltered: string[] = [];
  assetYearsFiltered: number[] = [];
  // UI state for custom dropdowns
  assetTypeInput = '';
  centerInput = '';
  makeInput = '';
  yearInput = '';
  showAssetTypeList = false;
  showCenterList = false;
  showMakeList = false;
  showYearList = false;
  appointments: any[] = [];
  saved = false;
  isSaving = false;
  saveError: string | null = null;
  year = new Date().getFullYear();

  constructor(private fb: FormBuilder, private fleet: FleetService) {
    this.form = this.fb.group({
      assetTypeId: ['', Validators.required],
      assetMake: [''],
      serviceCenterId: ['', Validators.required],
      assetYear: [''],
      appointmentDate: [null, Validators.required],
      appointmentTime: [null, Validators.required],
      notes: ['']
    });
    // populate years 1970..2026, newest first
    const start = 1970;
    const end = 2026;
    for (let y = end; y >= start; y--) this.assetYears.push(y);
    this.assetYearsFiltered = [...this.assetYears];
    // common truck manufacturers
    this.assetMakes = [
      'Ford', 'Chevrolet', 'Toyota', 'Volvo', 'Mercedes-Benz',
      'Freightliner', 'Peterbilt', 'Kenworth', 'Isuzu', 'Scania'
    ];
    this.assetMakesFiltered = [...this.assetMakes];
  }

  ngOnInit(): void {
    this.loadLookups();
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.fleet.getAppointments().subscribe(a => (this.appointments = a || []));
  }

  private loadLookups(): void {
    this.fleet.getAssetTypes().subscribe((a) => {
      this.assetTypes = a || [];
      this.ensureLocalFallbacks();
      this.assetTypesFiltered = [...this.assetTypes];
    });

    this.fleet.getServiceCenters().subscribe((s) => {
      this.centers = s || [];
      this.ensureLocalFallbacks();
      this.centersFiltered = [...this.centers];
    });
  }

  // For local dev: provide sensible fallbacks when API is unavailable
  private ensureLocalFallbacks(): void {
    if (!this.assetTypes || this.assetTypes.length === 0) {
      this.assetTypes = [
        { id: 1, name: 'Truck' },
        { id: 2, name: 'Van' },
        { id: 3, name: 'Sedan' }
      ];
      this.assetTypesFiltered = [...this.assetTypes];
    }

    if (!this.centers || this.centers.length === 0) {
      this.centers = [
        { id: 1, name: 'Central Service', city: 'Springfield' },
        { id: 2, name: 'Northside Service', city: 'Shelbyville' }
      ];
      this.centersFiltered = [...this.centers];
    }
  }

  filterAssetTypes(q: string): void {
    const v = (q || '').toLowerCase();
    this.assetTypesFiltered = this.assetTypes.filter(a => (a.name || '').toLowerCase().includes(v));
  }

  filterCenters(q: string): void {
    const v = (q || '').toLowerCase();
    this.centersFiltered = this.centers.filter(c => ((c.name || '') + ' ' + (c.city || '')).toLowerCase().includes(v));
  }

  filterMakes(q: string): void {
    const v = (q || '').toLowerCase();
    this.assetMakesFiltered = this.assetMakes.filter(m => (m || '').toLowerCase().includes(v));
  }

  filterYears(q: string): void {
    const v = (q || '').toLowerCase();
    this.assetYearsFiltered = this.assetYears.filter(y => String(y).includes(v));
  }

  submit(): void {
    this.saveError = null;
    if (this.form.invalid) {
      this.saveError = 'Please complete required fields.';
      return;
    }
    const raw = this.form.value as any;
    const datePart = raw.appointmentDate; // 'YYYY-MM-DD'
    const timePart = raw.appointmentTime || '00:00'; // 'HH:mm'

    const combinedIso = this.combineDateAndTimeToIso(datePart, timePart);
    if (!combinedIso) {
      this.saveError = 'Invalid date or time.';
      return;
    }

    const payload: any = {
      assetTypeId: Number(raw.assetTypeId),
      serviceCenterId: Number(raw.serviceCenterId),
      appointmentDate: combinedIso,
      notes: raw.notes || ''
    };
    if (raw.assetYear) payload.assetYear = Number(raw.assetYear);
    if (raw.assetMake) payload.assetMake = raw.assetMake;

    this.isSaving = true;
    this.fleet.createAppointment(payload).subscribe({
      next: () => {
        this.saved = true;
        this.isSaving = false;
        this.form.reset();
        this.loadAppointments();
        setTimeout(() => (this.saved = false), 3500);
      },
      error: (err) => {
        console.error('Save failed', err);
        this.saveError = 'Failed to save appointment. See console for details.';
        this.isSaving = false;
      }
    });
  }

  private combineDateAndTimeToIso(datePart?: string | null, timePart?: string | null): string | null {
    if (!datePart) return null;
    const dateSegments = datePart.split('-').map(s => Number(s));
    if (dateSegments.length !== 3) return null;
    const [year, month, day] = dateSegments;
    let hours = 0, minutes = 0;
    if (timePart) {
      const t = timePart.split(':').map(s => Number(s));
      if (t.length >= 2) {
        hours = t[0];
        minutes = t[1];
      }
    }
    const dt = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString();
  }

  onAssetTypeInput(value: string): void {
    const match = this.assetTypes.find(a => a.name === value);
    if (match) {
      this.form.controls['assetTypeId'].setValue(String(match.id));
    } else {
      this.form.controls['assetTypeId'].setValue('');
    }
  }

  onServiceCenterInput(value: string): void {
    const match = this.centers.find(c => (`${c.name} — ${c.city}`) === value);
    if (match) {
      this.form.controls['serviceCenterId'].setValue(String(match.id));
    } else {
      this.form.controls['serviceCenterId'].setValue('');
    }
  }

  toggleAssetTypeList(): void { this.showAssetTypeList = !this.showAssetTypeList; }
  toggleCenterList(): void { this.showCenterList = !this.showCenterList; }
  toggleMakeList(): void { this.showMakeList = !this.showMakeList; }
  toggleYearList(): void { this.showYearList = !this.showYearList; }

  selectAssetType(name: string): void {
    this.assetTypeInput = name;
    const match = this.assetTypes.find(a => a.name === name);
    if (match) this.form.controls['assetTypeId'].setValue(String(match.id));
    this.showAssetTypeList = false;
  }

  selectServiceCenter(label: string): void {
    this.centerInput = label;
    const match = this.centers.find(c => (`${c.name} — ${c.city}`) === label);
    if (match) this.form.controls['serviceCenterId'].setValue(String(match.id));
    this.showCenterList = false;
  }

  selectMake(name: string): void {
    this.makeInput = name;
    this.form.controls['assetMake'].setValue(name);
    this.showMakeList = false;
  }

  selectYear(y: number): void {
    this.yearInput = String(y);
    this.form.controls['assetYear'].setValue(String(y));
    this.showYearList = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    // if the click is inside any select wrapper, ignore so existing lists stay open
    if (target.closest && target.closest('.select-wrapper')) return;
    // otherwise close all custom dropdowns
    this.showAssetTypeList = false;
    this.showCenterList = false;
    this.showMakeList = false;
    this.showYearList = false;
  }
}
