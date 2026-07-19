import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './admin-activity.component.html',
})
export class AdminActivityComponent implements OnInit {
  activities: any[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchActivities();
  }

  fetchActivities() {
    this.loading = true;
    const params = this.searchTerm ? `?search=${this.searchTerm}` : '';
    this.api.get<any[]>(`/admin/activity-log${params}`).subscribe({
      next: (data) => { this.activities = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
