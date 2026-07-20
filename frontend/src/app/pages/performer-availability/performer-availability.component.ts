import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { PerformerAvailability } from '../../models/performer.model';

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isPast: boolean;
  status: 'free' | 'booked' | null;
  entryId?: string;
}

const MONTH_NAMES = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
const WEEKDAY_LABELS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

@Component({
  selector: 'app-performer-availability',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './performer-availability.component.html',
})
export class PerformerAvailabilityComponent implements OnInit {
  loading = true;
  performerId = '';
  dates: PerformerAvailability[] = [];
  dateMap = new Map<string, PerformerAvailability>();

  viewYear = new Date().getFullYear();
  viewMonth = new Date().getMonth();
  calendarDays: CalendarDay[] = [];

  monthNames = MONTH_NAMES;
  weekdayLabels = WEEKDAY_LABELS;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (!session?.user.id) return;
    this.performerId = session.user.id;
    this.performerService.getAvailability(this.performerId).subscribe((data) => {
      this.dates = data;
      this.rebuildMap();
      this.buildCalendar();
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get monthLabel(): string {
    return `${this.monthNames[this.viewMonth]} ${this.viewYear}`;
  }

  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 0) {
      this.viewMonth = 11;
      this.viewYear--;
    }
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 11) {
      this.viewMonth = 0;
      this.viewYear++;
    }
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  async dayClick(cell: CalendarDay) {
    if (!cell.inMonth || cell.isPast) return;

    if (!cell.status) {
      const { data } = await this.supabase.client
        .from('performer_availability')
        .insert({ performer_id: this.performerId, date: cell.date, status: 'free' })
        .select()
        .single();
      if (data) this.dates.push(data);
    } else if (cell.status === 'free') {
      await this.supabase.client
        .from('performer_availability')
        .update({ status: 'booked' })
        .eq('id', cell.entryId);
      const entry = this.dates.find((d) => d.id === cell.entryId);
      if (entry) entry.status = 'booked';
    } else {
      await this.supabase.client.from('performer_availability').delete().eq('id', cell.entryId);
      this.dates = this.dates.filter((d) => d.id !== cell.entryId);
    }

    this.rebuildMap();
    this.buildCalendar();
    this.cdr.detectChanges();
  }

  private rebuildMap() {
    this.dateMap = new Map(this.dates.map((d) => [d.date, d]));
  }

  private buildCalendar() {
    const todayStr = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(this.viewYear, this.viewMonth, 1);
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();

    const days: CalendarDay[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      days.push({ date: '', day: 0, inMonth: false, isPast: false, status: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = this.dateMap.get(dateStr);
      days.push({
        date: dateStr,
        day: d,
        inMonth: true,
        isPast: dateStr < todayStr,
        status: entry?.status || null,
        entryId: entry?.id,
      });
    }
    this.calendarDays = days;
  }
}
