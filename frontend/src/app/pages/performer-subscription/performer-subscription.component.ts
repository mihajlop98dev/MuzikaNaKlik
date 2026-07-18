import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-performer-subscription',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './performer-subscription.component.html',
})
export class PerformerSubscriptionComponent implements OnInit {
  subscriptions: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/performers/me/subscriptions').subscribe({
      next: (data) => {
        this.subscriptions = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
