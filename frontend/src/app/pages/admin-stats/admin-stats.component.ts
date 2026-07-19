import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [NgIf, BaseChartDirective],
  templateUrl: './admin-stats.component.html',
})
export class AdminStatsComponent implements OnInit {
  loading = true;

  registrationsData: ChartConfiguration['data'] | null = null;
  registrationsOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
  };

  planLabels: string[] = [];
  planData: number[] = [];
  planChartType: ChartType = 'pie';

  statusLabels: string[] = [];
  statusData: number[] = [];
  statusChartType: ChartType = 'pie';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any>('/admin/reports/registrations').subscribe({
      next: (r) => {
        this.registrationsData = {
          labels: r.labels,
          datasets: [
            { data: r.data.map((d: any) => d.performers), label: 'Izvođači', backgroundColor: '#42a5f5' },
            { data: r.data.map((d: any) => d.clients), label: 'Klijenti', backgroundColor: '#66bb6a' },
          ],
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.api.get<any>('/admin/reports/subscriptions').subscribe({
      next: (r) => {
        this.planLabels = r.planDistribution.map((p: any) => p.name);
        this.planData = r.planDistribution.map((p: any) => p.count);
        this.statusLabels = r.statusDistribution.map((s: any) => s.name);
        this.statusData = r.statusDistribution.map((s: any) => s.count);
        this.cdr.detectChanges();
      },
    });
  }
}
