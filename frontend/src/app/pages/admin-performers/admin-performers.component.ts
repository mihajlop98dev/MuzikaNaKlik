import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-performers',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-performers.component.html',
})
export class AdminPerformersComponent implements OnInit {
  performers: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/admin/performers/pending').subscribe({
      next: (data) => {
        console.log('Admin performers data:', data);
        this.performers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Admin performers error:', err);
        this.loading = false;
      },
    });
  }

  approve(id: string) {
    this.api.put(`/admin/performers/${id}`, { status: 'approved' }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); },
    });
  }

  reject(id: string) {
    this.api.put(`/admin/performers/${id}`, { status: 'rejected' }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); },
    });
  }
}
