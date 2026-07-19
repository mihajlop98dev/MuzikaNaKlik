import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe],
  templateUrl: './admin-subscriptions.component.html',
})
export class AdminSubscriptionsComponent implements OnInit {
  subscriptions: any[] = [];
  loading = true;
  statusFilter = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchSubscriptions();
  }

  fetchSubscriptions() {
    this.loading = true;
    const params = this.statusFilter ? `?status=${this.statusFilter}` : '';
    this.api.get<any[]>(`/admin/subscriptions${params}`).subscribe({
      next: (data) => { this.subscriptions = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  setFilter(status: string) {
    this.statusFilter = status;
    this.fetchSubscriptions();
  }

  getStatusLabel(status: string): string {
    return { active: 'Aktivna', expired: 'Istekla', cancelled: 'Otkazana' }[status] || status;
  }

  getStatusColor(status: string): string {
    return { active: '#2e7d32', expired: '#e65100', cancelled: '#888' }[status] || '#888';
  }
}
