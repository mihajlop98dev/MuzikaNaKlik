import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];

// Validated categorical palette (dataviz skill), fixed order — dark-mode steps.
const SERIES_BLUE = '#3987e5';
const SERIES_ORANGE = '#d95926';
const SERIES_AQUA = '#199e70';
const CATEGORICAL = [SERIES_BLUE, SERIES_ORANGE, SERIES_AQUA];

// Fixed status palette — never themed, never reused for series identity.
const STATUS_COLORS: Record<string, string> = {
  approved: '#0ca30c',
  pending: '#fab219',
  rejected: '#d03b3b',
};
const STATUS_LABELS: Record<string, string> = {
  approved: 'Odobreno',
  pending: 'Na čekanju',
  rejected: 'Odbijeno',
};

const INK_MUTED = '#9a989f';
const GRIDLINE = 'rgba(243,242,239,0.06)';

interface KpiTile {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'flat';
}

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [NgIf, NgFor, BaseChartDirective],
  templateUrl: './admin-stats.component.html',
})
export class AdminStatsComponent implements OnInit {
  loading = true;

  registrationKpis: KpiTile[] = [];
  approvalKpi: KpiTile | null = null;

  get kpis(): KpiTile[] {
    return this.approvalKpi ? [...this.registrationKpis, this.approvalKpi] : this.registrationKpis;
  }

  registrationsData: ChartConfiguration['data'] | null = null;
  registrationsOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: INK_MUTED, usePointStyle: true, boxWidth: 8, boxHeight: 8 },
      },
      tooltip: { backgroundColor: '#101013', borderColor: '#2a2620', borderWidth: 1, padding: 10 },
    },
    scales: {
      x: { grid: { color: GRIDLINE }, ticks: { color: INK_MUTED } },
      y: { beginAtZero: true, grid: { color: GRIDLINE }, ticks: { color: INK_MUTED, precision: 0 } },
    },
  };

  planData: ChartConfiguration['data'] | null = null;
  planOptions: ChartConfiguration['options'] = this.horizontalBarOptions();

  statusData: ChartConfiguration['data'] | null = null;
  statusOptions: ChartConfiguration['options'] = this.horizontalBarOptions();

  hasPlanData = false;
  hasStatusData = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any>('/admin/reports/registrations').subscribe({
      next: (r) => {
        const performers = r.data.map((d: any) => d.performers);
        const clients = r.data.map((d: any) => d.clients);

        this.registrationsData = {
          labels: r.labels.map((l: string) => this.formatMonth(l)),
          datasets: [
            {
              data: performers,
              label: 'Izvođači',
              borderColor: SERIES_BLUE,
              backgroundColor: this.withAlpha(SERIES_BLUE, 0.1),
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHitRadius: 12,
              pointBackgroundColor: SERIES_BLUE,
            },
            {
              data: clients,
              label: 'Klijenti',
              borderColor: SERIES_ORANGE,
              backgroundColor: this.withAlpha(SERIES_ORANGE, 0.1),
              fill: true,
              tension: 0.35,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHitRadius: 12,
              pointBackgroundColor: SERIES_ORANGE,
            },
          ],
        };

        this.buildRegistrationKpis(performers, clients);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.api.get<any>('/admin/reports/subscriptions').subscribe({
      next: (r) => {
        const plans = r.planDistribution as { name: string; count: number }[];
        this.hasPlanData = plans.length > 0;
        this.planData = {
          labels: plans.map(p => `${p.name} — ${p.count}`),
          datasets: [{
            data: plans.map(p => p.count),
            backgroundColor: plans.map((_, i) => CATEGORICAL[i % CATEGORICAL.length]),
            borderRadius: 6,
            barThickness: 22,
          }],
        };

        const statuses = r.statusDistribution as { name: string; count: number }[];
        this.hasStatusData = statuses.length > 0;
        this.statusData = {
          labels: statuses.map(s => `${STATUS_LABELS[s.name] || s.name} — ${s.count}`),
          datasets: [{
            data: statuses.map(s => s.count),
            backgroundColor: statuses.map(s => STATUS_COLORS[s.name] || INK_MUTED),
            borderRadius: 6,
            barThickness: 22,
          }],
        };

        this.buildApprovalKpi(statuses);
        this.cdr.detectChanges();
      },
    });
  }

  private buildRegistrationKpis(performers: number[], clients: number[]) {
    const totalPerformers = performers.reduce((a, b) => a + b, 0);
    const totalClients = clients.reduce((a, b) => a + b, 0);

    const thisMonth = (performers.at(-1) || 0) + (clients.at(-1) || 0);
    const lastMonth = (performers.at(-2) || 0) + (clients.at(-2) || 0);
    const delta = thisMonth - lastMonth;
    const direction: 'up' | 'down' | 'flat' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

    this.registrationKpis = [
      { label: 'Izvođači (12mj)', value: String(totalPerformers) },
      { label: 'Klijenti (12mj)', value: String(totalClients) },
      {
        label: 'Registracije ovog meseca',
        value: String(thisMonth),
        delta: delta === 0 ? 'bez promene' : `${delta > 0 ? '+' : ''}${delta} vs prošli mesec`,
        deltaDirection: direction,
      },
    ];
  }

  private buildApprovalKpi(statuses: { name: string; count: number }[]) {
    const total = statuses.reduce((a, s) => a + s.count, 0);
    const approved = statuses.find(s => s.name === 'approved')?.count || 0;
    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
    this.approvalKpi = { label: 'Odobreni izvođači', value: `${rate}%` };
  }

  private formatMonth(key: string): string {
    const [, month] = key.split('-');
    return MONTH_NAMES[Number(month) - 1] || key;
  }

  private withAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private horizontalBarOptions(): ChartConfiguration['options'] {
    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#101013', borderColor: '#2a2620', borderWidth: 1, padding: 10 },
      },
      scales: {
        x: { beginAtZero: true, grid: { color: GRIDLINE }, ticks: { color: INK_MUTED, precision: 0 } },
        y: { grid: { display: false }, ticks: { color: '#f3f2ef', font: { weight: 600 } } },
      },
    };
  }
}
