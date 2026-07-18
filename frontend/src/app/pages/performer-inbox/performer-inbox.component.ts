import { Component, OnInit } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Inquiry } from '../../models/performer.model';

@Component({
  selector: 'app-performer-inbox',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './performer-inbox.component.html',
})
export class PerformerInboxComponent implements OnInit {
  inquiries: Inquiry[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<Inquiry[]>('/performers/me/inquiries').subscribe({
      next: (data) => {
        this.inquiries = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  markAsRead(inquiry: Inquiry) {
    this.api.put('/performers/me/inquiries', { id: inquiry.id, status: 'read' }).subscribe({
      next: () => {
        inquiry.status = 'read';
      },
    });
  }
}
