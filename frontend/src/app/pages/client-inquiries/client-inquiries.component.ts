import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-client-inquiries',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './client-inquiries.component.html',
})
export class ClientInquiriesComponent implements OnInit {
  inquiries: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/inquiries/mine').subscribe({
      next: (data) => { this.inquiries = data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }
}
