import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [NgIf],
  templateUrl: './admin-stats.component.html',
})
export class AdminStatsComponent implements OnInit {
  stats: any = {};
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any>('/admin/stats').subscribe({
      next: (data) => { this.stats = data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }
}
