import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FleetService } from './fleet.service';

type CalendarCell = {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  appointmentCount: number;
};

@Component({
  selector: 'app-workshop',
  standalone: true,
  imports: [CommonModule],
  template: `
  <section class="container card workshop-page" aria-labelledby="workshop-heading">
    <div class="workshop-head">
      <div>
        <h2 id="workshop-heading">Workshop</h2>
        <p class="workshop-subtitle">Schedule and monitor workshop service appointments.</p>
      </div>
      <div class="workshop-stat" aria-live="polite">
        <span class="stat-label">Current appointments</span>
        <strong class="stat-value">{{ appointments.length }}</strong>
      </div>
    </div>

    <div class="calendar-toolbar">
      <button class="btn-secondary" (click)="goToPreviousMonth()" aria-label="Previous month">Previous</button>
      <h3 class="calendar-month">{{ monthTitle }}</h3>
      <div class="calendar-actions">
        <button
          class="btn-secondary"
          [class.active]="isTodaySelected"
          [attr.aria-pressed]="isTodaySelected"
          (click)="goToToday()"
          aria-label="Go to today"
        >
          Today
        </button>
        <button class="btn-secondary" (click)="goToNextMonth()" aria-label="Next month">Next</button>
      </div>
    </div>

    <div *ngIf="invalidAppointmentsPayload" class="calendar-warning" role="status" aria-live="polite">
      Appointments data could not be read correctly. Showing calendar days without appointment marks.
    </div>

    <div class="calendar-grid" role="grid" aria-label="Workshop appointments calendar">
      <div class="weekday" *ngFor="let day of weekdays" role="columnheader">{{ day }}</div>
      <div
        class="day-cell"
        *ngFor="let cell of calendarCells"
        [class.other-month]="!cell.inCurrentMonth"
        [class.has-appointments]="cell.appointmentCount > 0"
        [class.selected]="selectedDateKey === cell.key"
        role="gridcell"
        tabindex="0"
        (click)="selectDate(cell)"
        (keydown.enter)="selectDate(cell)"
        (keydown.space)="selectDate(cell); $event.preventDefault()"
        [attr.aria-label]="formatAriaLabel(cell)"
      >
        <span class="day-number">{{ cell.date.getDate() }}</span>
        <div class="marks" *ngIf="cell.appointmentCount > 0" aria-hidden="true">
          <span class="mark" *ngFor="let _ of getMarks(cell.appointmentCount)"></span>
        </div>
        <span *ngIf="cell.appointmentCount > 3" class="more-count">+{{ cell.appointmentCount - 3 }}</span>
      </div>
    </div>

    <section class="selected-day" *ngIf="selectedDateKey" aria-live="polite">
      <h4 class="selected-title">Appointments on {{ selectedDateLabel }}</h4>
      <div *ngIf="selectedDateAppointments.length === 0" class="selected-empty">No appointments on this date.</div>
      <ul *ngIf="selectedDateAppointments.length > 0" class="selected-list">
        <li *ngFor="let appointment of selectedDateAppointments" class="selected-item">
          <strong>#{{ appointment.id }}</strong>
          <span>• {{ formatAppointmentTime(appointment.appointmentDate) }}</span>
          <span *ngIf="appointment.assetMake">• {{ appointment.assetMake }}</span>
        </li>
      </ul>
    </section>
  </section>
  `,
  styles: [`
    .workshop-page { padding-top: 18px; padding-bottom: 20px; }
    .workshop-head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
    .workshop-subtitle { margin:4px 0 0; color: var(--text-muted); font-size:14px; }
    .workshop-stat { background: rgba(15,178,227,0.08); border:1px solid rgba(20,39,61,0.06); border-radius:10px; padding:10px 14px; min-width:170px; text-align:right; }
    .stat-label { display:block; color:var(--text-muted); font-size:12px; }
    .stat-value { display:block; color:var(--text-dark); font-size:24px; line-height:1.1; margin-top:4px; }
    .calendar-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:10px 0 14px; }
    .calendar-actions { display:flex; align-items:center; gap:8px; }
    .calendar-actions .btn-secondary.active {
      border-color: var(--brand-blue-1);
      color: var(--text-dark);
      box-shadow: inset 0 0 0 1px var(--brand-blue-1);
      background: rgba(15,178,227,0.1);
    }
    .calendar-warning {
      margin: 0 0 10px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid rgba(20,39,61,0.12);
      background: rgba(245,128,35,0.08);
      color: var(--text-dark);
      font-size: 13px;
    }
    .calendar-month { margin:0; font-size:20px; }
    .calendar-grid { display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border:1px solid rgba(20,39,61,0.06); border-radius:12px; overflow:hidden; }
    .weekday { padding:10px; font-size:12px; font-weight:700; text-transform:uppercase; color:var(--text-muted); background: rgba(20,39,61,0.03); border-bottom:1px solid rgba(20,39,61,0.06); }
    .day-cell { min-height:88px; padding:8px; border-right:1px solid rgba(20,39,61,0.06); border-bottom:1px solid rgba(20,39,61,0.06); display:flex; flex-direction:column; gap:8px; }
    .day-cell:nth-child(7n) { border-right:none; }
    .day-cell:focus-visible { outline: 2px solid var(--brand-blue-1); outline-offset: -2px; }
    .day-number { font-size:13px; font-weight:600; color:var(--text-dark); }
    .other-month .day-number { color:var(--text-muted); opacity:0.55; }
    .marks { display:flex; gap:4px; flex-wrap:wrap; }
    .mark { width:8px; height:8px; border-radius:50%; background: var(--brand-orange); }
    .has-appointments { background: rgba(245,128,35,0.06); }
    .selected { box-shadow: inset 0 0 0 2px var(--brand-blue-1); }
    .more-count { font-size:11px; color:var(--text-muted); margin-top:auto; }
    .selected-day { margin-top:14px; border:1px solid rgba(20,39,61,0.06); border-radius:10px; padding:10px 12px; background: rgba(20,39,61,0.02); }
    .selected-title { margin:0 0 8px; font-size:16px; }
    .selected-empty { color: var(--text-muted); font-size:14px; }
    .selected-list { margin:0; padding-left:18px; }
    .selected-item { margin:4px 0; color:var(--text-dark); }

    @media (max-width: 700px) {
      .calendar-month { font-size:17px; }
      .day-cell { min-height:70px; padding:6px; }
      .weekday { padding:8px 6px; font-size:11px; }
    }
  `]
})
export class WorkshopComponent implements OnInit {
  appointments: any[] = [];
  currentMonthDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  calendarCells: CalendarCell[] = [];
  appointmentCountByDate = new Map<string, number>();
  selectedDateKey: string | null = null;
  invalidAppointmentsPayload = false;

  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private fleet: FleetService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.buildCalendar();
    this.loadAppointments();
  }

  get isTodaySelected(): boolean {
    if (!this.selectedDateKey) {
      return false;
    }
    return this.selectedDateKey === this.toDateKey(new Date());
  }

  get selectedDateLabel(): string {
    if (!this.selectedDateKey) {
      return '';
    }
    const date = new Date(`${this.selectedDateKey}T00:00:00`);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  get selectedDateAppointments(): any[] {
    if (!this.selectedDateKey) {
      return [];
    }
    return this.appointments
      .filter((appointment) => this.getDateKey(appointment?.appointmentDate) === this.selectedDateKey)
      .sort((a, b) => {
        const t1 = new Date(a.appointmentDate).getTime();
        const t2 = new Date(b.appointmentDate).getTime();
        return t1 - t2;
      });
  }

  get monthTitle(): string {
    return this.currentMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  goToPreviousMonth(): void {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  goToNextMonth(): void {
    this.currentMonthDate = new Date(this.currentMonthDate.getFullYear(), this.currentMonthDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToToday(): void {
    const now = new Date();
    this.currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.buildCalendar();
    this.selectedDateKey = this.toDateKey(now);
  }

  loadAppointments(): void {
    this.fleet.getAppointments().subscribe((rows) => {
      this.invalidAppointmentsPayload = !Array.isArray(rows);
      this.appointments = Array.isArray(rows) ? rows : [];
      this.rebuildAppointmentDateMap();
      this.buildCalendar();
      try { this.cdr.detectChanges(); } catch {}
    });
  }

  selectDate(cell: CalendarCell): void {
    this.selectedDateKey = cell.key;
  }

  rebuildAppointmentDateMap(): void {
    this.appointmentCountByDate.clear();
    for (const appointment of this.appointments) {
      const key = this.getDateKey(appointment?.appointmentDate);
      if (!key) {
        continue;
      }
      this.appointmentCountByDate.set(key, (this.appointmentCountByDate.get(key) || 0) + 1);
    }
  }

  buildCalendar(): void {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = firstDayOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    const cells: CalendarCell[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = this.toDateKey(date);
      cells.push({
        date,
        key,
        inCurrentMonth: date.getMonth() === month,
        appointmentCount: this.appointmentCountByDate.get(key) || 0
      });
    }

    this.calendarCells = cells;
  }

  getMarks(count: number): number[] {
    return Array.from({ length: Math.min(3, count) }, (_, i) => i);
  }

  formatAriaLabel(cell: CalendarCell): string {
    const dateLabel = cell.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (cell.appointmentCount === 0) {
      return `${dateLabel}. No appointments.`;
    }
    return `${dateLabel}. ${cell.appointmentCount} appointment${cell.appointmentCount === 1 ? '' : 's'}.`;
  }

  formatAppointmentTime(value: string | null | undefined): string {
    if (!value) {
      return 'Time unknown';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Time unknown';
    }
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  private getDateKey(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return this.toDateKey(date);
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
