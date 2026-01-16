import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FleetService } from './fleet.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <section class="container card" aria-labelledby="appointments-heading">
    <h2 id="appointments-heading">Appointments</h2>
    <div class="appointments-toolbar">
      <div class="filters">
        <label class="filter-group">
          <span class="filter-label">Asset Type</span>
          <select [(ngModel)]="selectedAssetTypeId" (ngModelChange)="onFilterChange()" class="select-input">
            <option [ngValue]="0">All</option>
            <option *ngFor="let t of assetTypes" [ngValue]="t.id">{{ t.name }}</option>
          </select>
        </label>
        <label class="filter-group">
          <span class="filter-label">Service Center</span>
          <select [(ngModel)]="selectedServiceCenterId" (ngModelChange)="onFilterChange()" class="select-input">
            <option [ngValue]="0">All</option>
            <option *ngFor="let s of serviceCenters" [ngValue]="s.id">{{ s.name }}</option>
          </select>
        </label>
        <button class="btn-primary" (click)="clearFilters()">Clear filters</button>
      </div>
      <div class="toolbar-actions">
        <button class="btn-primary" (click)="loadAppointments()">Refresh</button>
      </div>
    </div>
    <div *ngIf="filteredAppointments.length === 0">No appointments yet.</div>

    <div *ngIf="filteredAppointments.length > 0" class="appointments-grid">
      <article *ngFor="let ap of filteredAppointments" class="appointment-card" [class.expanded]="expandedIds.has(ap.id)" [attr.data-id]="ap.id">
        <header class="card-header" style="display:flex;justify-content:space-between;align-items:start">
          <div>
            <div class="title">{{ getAssetTypeName(ap.assetTypeId) || 'Asset' }} • {{ ap.assetMake || 'Unknown' }} {{ ap.assetYear || '' }}</div>
            <div class="meta">#{{ ap.id }} — {{ formatDate(ap.appointmentDate) }}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn-primary" *ngIf="editingId !== ap.id" (click)="startEdit(ap)">Edit</button>
            <button class="btn-primary" style="background:#ef4444" *ngIf="editingId !== ap.id" (click)="promptDelete(ap.id)">Delete</button>
            <ng-container *ngIf="editingId === ap.id">
              <button class="btn-primary" (click)="saveEdit()">Save</button>
              <button class="btn-primary" style="background:#6b7280" (click)="cancelEdit()">Cancel</button>
            </ng-container>
            <button class="btn btn-secondary more-btn" *ngIf="showMore[ap.id] || (ap.notes && ap.notes.length > 200)" (click)="toggleExpand(ap.id)">
              {{ expandedIds.has(ap.id) ? 'Less' : 'More' }}
            </button>
          </div>
        </header>

        <div class="card-body">
          <div *ngIf="editingId !== ap.id">
            <div class="row"><strong>Service Center:</strong> {{ getServiceCenterName(ap.serviceCenterId) || '—' }}</div>
            <div class="row"><strong>Notes:</strong> <span class="notes">{{ ap.notes || '—' }}</span></div>
          </div>

          <!-- Inline editing removed; editing now occurs in a modal dialog to improve usability -->
        </div>
      </article>
    </div>

    <!-- Edit appointment modal dialog -->
    <div *ngIf="editingId !== null" class="confirm-backdrop" (click)="cancelEdit()">
      <div class="confirm-dialog card" role="dialog" aria-modal="true" aria-labelledby="edit-heading" (click)="$event.stopPropagation()">
        <h3 id="edit-heading">Edit appointment #{{ editingId }}</h3>
        <form (ngSubmit)="saveEdit()" style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <label style="flex:1">
              Date
              <input type="date" [(ngModel)]="editModel.appointmentDateInput" (change)="onDatePicked($event)" name="modalAppointmentDate" class="date-input" />
            </label>
            <label style="width:220px">
              Time
              <input type="time" [(ngModel)]="editModel.appointmentTime" (change)="onTimePicked($event)" name="modalAppointmentTime" class="date-input" />
            </label>
          </div>
          <div style="display:flex;gap:8px">
            <label style="flex:1">
              Asset Make
              <input type="text" [(ngModel)]="editModel.assetMake" name="modalAssetMake" class="select-input" />
            </label>
            <label style="width:140px">
              Asset Year
              <input type="number" [(ngModel)]="editModel.assetYear" name="modalAssetYear" class="select-input" />
            </label>
          </div>
          <label>
            Notes
            <textarea [(ngModel)]="editModel.notes" name="modalNotes" rows="4" class="select-input"></textarea>
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
            <button type="button" class="btn-secondary" (click)="cancelEdit()">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Styled confirmation dialog (in-app) -->
    <div *ngIf="confirmingId !== null" class="confirm-backdrop" (click)="cancelDelete()">
      <div class="confirm-dialog card" role="dialog" aria-modal="true" aria-labelledby="confirm-heading" (click)="$event.stopPropagation()">
        <h3 id="confirm-heading">Confirm delete</h3>
        <p>Are you sure you want to delete appointment #{{ confirmingId }}? This action cannot be undone.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="btn-secondary" (click)="cancelDelete()">Cancel</button>
          <button class="btn-primary" style="background:#ef4444" (click)="confirmDelete()">Delete</button>
        </div>
      </div>
    </div>
  </section>
  `
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  appointments: any[] = [];
  assetTypes: any[] = [];
  serviceCenters: any[] = [];
  // time is stored as `editModel.appointmentTime` (HH:mm)

  editingId: number | null = null;
  editModel: any = {};
  // track which appointment tiles are expanded and whether to show the "More" control
  expandedIds = new Set<number>();
  showMore: { [id: number]: boolean } = {};
  selectedAssetTypeId: number = 0;
  selectedServiceCenterId: number = 0;
  resizeHandler: any = null;
  // id currently being confirmed for deletion (used to show a styled confirmation dialog)
  confirmingId: number | null = null;

  private routerSub: Subscription | null = null;

  constructor(private fleet: FleetService, private router: Router, private cdr: ChangeDetectorRef, private auth: AuthService) {}

  ngOnInit(): void {
    // using native time input; no custom hour/minute arrays needed
    this.loadLookups();
    this.loadAppointments();
    // If route reuse or navigation returns to this component, reload appointments
    this.routerSub = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        if (evt.urlAfterRedirects && evt.urlAfterRedirects.includes('/appointments')) {
          this.loadAppointments();
        }
      }
    });

    // Extra reload shortly after init to avoid a startup race where auth
    // headers or other providers may not be ready yet on first call.
    setTimeout(() => this.loadAppointments(), 250);
    // attach resize handler to re-evaluate overflow when window size changes
    this.resizeHandler = this.evaluateOverflow.bind(this);
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (this.routerSub) { this.routerSub.unsubscribe(); this.routerSub = null; }
    if (this.resizeHandler) { window.removeEventListener('resize', this.resizeHandler); this.resizeHandler = null; }
  }

  onFilterChange(): void {
    try { this.cdr.detectChanges(); } catch {}
    // re-evaluate overflow after the filtered list updates
    setTimeout(() => this.evaluateOverflow(), 120);
  }

  clearFilters(): void {
    this.selectedAssetTypeId = 0;
    this.selectedServiceCenterId = 0;
    this.onFilterChange();
  }

  get filteredAppointments(): any[] {
    return this.appointments.filter(a => {
      if (this.selectedAssetTypeId && a.assetTypeId !== this.selectedAssetTypeId) return false;
      if (this.selectedServiceCenterId && a.serviceCenterId !== this.selectedServiceCenterId) return false;
      return true;
    });
  }

  

  loadLookups(): void {
    this.fleet.getAssetTypes().subscribe(a => { this.assetTypes = a || []; try { this.cdr.detectChanges(); } catch {} });
    this.fleet.getServiceCenters().subscribe(s => { this.serviceCenters = s || []; try { this.cdr.detectChanges(); } catch {} });
  }

  loadAppointments(): void {
    this.fleet.getAppointments().subscribe(a => {
      this.appointments = a || [];
      try { this.cdr.detectChanges(); } catch (e) { console.warn('detectChanges failed', e); }
      // evaluate whether any appointment card content overflows so we can show a "More" toggle
      // delay slightly to allow layout to stabilise (images/fonts/etc)
      setTimeout(() => this.evaluateOverflow(), 250);
    });
  }

  evaluateOverflow(): void {
    try {
      // ensure we run after the browser painted
      requestAnimationFrame(() => {
        const cards = document.querySelectorAll('.appointments-grid .appointment-card');
        cards.forEach(c => {
          const idAttr = c.getAttribute('data-id');
          if (!idAttr) return;
          const id = Number(idAttr);
          const body = c.querySelector('.card-body') as HTMLElement | null;
          if (!body) return;
          // check specific notes element first for overflow
          const notesEl = body.querySelector('.notes') as HTMLElement | null;
          let overflows = false;
          if (notesEl) {
            // primary: check if the notes element is visually clipped by measuring full height
            try {
              const clone = notesEl.cloneNode(true) as HTMLElement;
              const cs = window.getComputedStyle(notesEl);
              // apply computed width and font styles so measurement matches
              clone.style.width = cs.width;
              clone.style.whiteSpace = cs.whiteSpace;
              clone.style.font = cs.font;
              clone.style.padding = cs.padding;
              clone.style.lineHeight = cs.lineHeight;
              clone.style.visibility = 'hidden';
              clone.style.position = 'absolute';
              clone.style.left = '-9999px';
              clone.style.top = '0';
              clone.style.maxWidth = cs.maxWidth;
              clone.style.boxSizing = cs.boxSizing;
              document.body.appendChild(clone);
              const fullHeight = clone.scrollHeight || clone.offsetHeight || 0;
              const visibleHeight = notesEl.clientHeight || 0;
              document.body.removeChild(clone);
              overflows = fullHeight > visibleHeight + 2;
            } catch (e) {
              // fallback to basic metrics and heuristics
              overflows = (notesEl.scrollHeight > notesEl.clientHeight + 2) || (notesEl.scrollWidth > notesEl.clientWidth + 2);
              if (!overflows) {
                const txt = (notesEl.textContent || '').trim();
                if (txt.length > 180) overflows = true;
              }
            }
          } else {
            // if no notes element, fall back to body overflow detection
            overflows = (body.scrollHeight > body.clientHeight + 2) || (body.scrollWidth > body.clientWidth + 2);
          }
          this.showMore[id] = !!overflows;
        });
        try { this.cdr.detectChanges(); } catch {}
      });
    } catch (e) {
      // ignore
    }
  }

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
    try { this.cdr.detectChanges(); } catch {}
  }

  startEdit(ap: any): void {
    this.editingId = ap.id;
    this.editModel = { ...ap };
    // split existing appointment date into separate date and time inputs
    const dt = this.toLocalDatetimeInput(ap.appointmentDate);
    if (dt) {
      const parts = dt.split('T');
      this.editModel.appointmentDateInput = parts[0] || '';
      this.editModel.appointmentTime = (parts[1] || '').slice(0,5) || '00:00';
    } else {
      this.editModel.appointmentDateInput = '';
      this.editModel.appointmentTime = '00:00';
    }
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editModel = {};
  }

  saveEdit(): void {
    if (!this.editModel) return;
    const payload = { ...this.editModel };
    // convert input back to ISO datetime
    // If date/time inputs are present, combine them; fall back to existing appointmentInput
    if (this.editModel.appointmentDateInput) {
      const time = this.editModel.appointmentTime || '00:00';
      const combined = this.combineLocalDateTime(this.editModel.appointmentDateInput, time);
      payload.appointmentDate = combined;
    } else if (this.editModel.appointmentInput) {
      payload.appointmentDate = this.fromLocalDatetimeInput(this.editModel.appointmentInput);
    }
    // ensure id is present
    const id = payload.id;
    // debug: log token and roles to help diagnose authorization issues
    try { console.debug('Auth token:', this.auth.getToken()); console.debug('User roles:', this.auth.getUserRoles()); } catch (e) {}

    this.fleet.updateAppointment(id, payload).subscribe({
      next: () => {
        this.editingId = null;
        this.editModel = {};
        this.loadAppointments();
      },
      error: (err) => {
        console.error('Failed to save appointment', err);
      }
    });
  }

  // show an in-app confirmation dialog instead of the native browser confirm()
  promptDelete(id: number): void {
    this.confirmingId = id;
    try { this.cdr.detectChanges(); } catch {}
  }

  cancelDelete(): void {
    this.confirmingId = null;
    try { this.cdr.detectChanges(); } catch {}
  }

  confirmDelete(): void {
    const id = this.confirmingId;
    if (id == null) return;
    this.confirmingId = null;
    this.fleet.deleteAppointment(id).subscribe({
      next: () => this.loadAppointments(),
      error: (err) => console.error('Failed to delete', err)
    });
  }

  getAssetTypeName(id: any): string | undefined {
    const t = this.assetTypes.find(x => x.id === id);
    return t ? t.name : undefined;
  }

  getServiceCenterName(id: any): string | undefined {
    const s = this.serviceCenters.find(x => x.id === id);
    return s ? s.name : undefined;
  }

  formatDate(val: string | null | undefined): string {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val as string;
    return d.toLocaleString();
  }

  toLocalDatetimeInput(val: string | null | undefined): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  fromLocalDatetimeInput(val: string): string {
    // treat input as local and produce ISO string
    const d = new Date(val);
    return d.toISOString();
  }

  // called when a date is picked from the native date-control; blur the control so the calendar closes
  onDatePicked(evt: any): void {
    try {
      const el = evt && evt.target as HTMLElement;
      if (el && typeof (el as any).blur === 'function') (el as any).blur();
    } catch (e) {
      // ignore
    }
  }

  // called when a time is picked from the native time-control; blur so native picker closes
  onTimePicked(evt: any): void {
    try {
      const el = evt && evt.target as HTMLElement;
      if (el && typeof (el as any).blur === 'function') (el as any).blur();
    } catch (e) {
      // ignore
    }
  }

  // Combine local date (YYYY-MM-DD) and time (HH:mm) into an ISO datetime string
  combineLocalDateTime(datePart: string, timePart: string): string {
    // ensure fallback values
    const date = datePart || '';
    const time = timePart || '00:00';
    // construct a local datetime and convert to ISO
    const local = new Date(`${date}T${time}`);
    return local.toISOString();
  }
}

