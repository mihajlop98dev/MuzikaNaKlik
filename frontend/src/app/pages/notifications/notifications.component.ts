import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, DatePipe],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/notifications').subscribe({
      next: (data) => { this.notifications = data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  markRead(id: string) {
    this.api.put('/notifications', { id }).subscribe({
      next: () => {
        const n = this.notifications.find(n => n.id === id);
        if (n) n.is_read = true;
      },
    });
  }
}
