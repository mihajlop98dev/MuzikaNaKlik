import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { PerformerService } from '../../services/performer.service';

@Component({
  selector: 'app-performer-subscription',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './performer-subscription.component.html',
})
export class PerformerSubscriptionComponent implements OnInit {
  subscriptions: any[] = [];
  loading = true;

  constructor(
    private performerService: PerformerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.performerService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
