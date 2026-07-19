import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent implements OnInit {
  plans: any[] = [];
  loading = true;
  savingId: string | null = null;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/admin/plans').subscribe({
      next: (data) => { this.plans = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  savePlan(plan: any) {
    this.savingId = plan.id;
    this.api.put(`/admin/plans/${plan.id}`, {
      name: plan.name,
      price: plan.price,
      is_active: plan.is_active,
    }).subscribe({
      next: () => { this.savingId = null; this.cdr.detectChanges(); },
      error: () => { this.savingId = null; this.cdr.detectChanges(); },
    });
  }
}
