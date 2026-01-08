import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, ReactiveFormsModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatNativeDateModule],
  template: `
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Fleet Service Scheduler</h1>

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Asset Type</mat-label>
        <select matNativeControl formControlName="assetTypeId" required>
          <option *ngFor="let a of assetTypes" [value]="a.id">{{a.name}}</option>
        </select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Service Center</mat-label>
        <select matNativeControl formControlName="serviceCenterId" required>
          <option *ngFor="let s of centers" [value]="s.id">{{s.name}} - {{s.city}}</option>
        </select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <input matInput [matDatepicker]="picker" formControlName="appointmentDateTime" placeholder="Choose a date and time">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <div class="flex justify-end">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded" [disabled]="form.invalid">Save Appointment</button>
      </div>
    </form>

    <p *ngIf="saved" class="mt-4 text-green-600">Appointment saved successfully!</p>
  </div>
  `
})
export class HomepageComponent {
  assetTypes: AssetType[] = [];
  centers: ServiceCenter[] = [];
  saved = false;

  form!: FormGroup;

  constructor(private fb: FormBuilder, private fleet: FleetService) {
    this.form = this.fb.group({
      assetTypeId: [null],
      serviceCenterId: [null],
      appointmentDateTime: [null],
      notes: ['']
    });

    this.loadLookups();
  }

  loadLookups() {
    this.fleet.getAssetTypes().subscribe(a => this.assetTypes = a);
    this.fleet.getServiceCenters().subscribe(s => this.centers = s);
  }

  submit() {
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
