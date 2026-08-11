import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-performer-subscription',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './performer-subscription.component.html',
})
export class PerformerSubscriptionComponent implements OnInit {
  subscriptions: any[] = [];
  plans: any[] = [];
  loading = true;
  paying = false;
  error = '';
  paymentResult: 'success' | 'canceled' | null = null;

  paidPlansEnabled = environment.paidPlansEnabled;

  constructor(
    private performerService: PerformerService,
    private api: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const stripeParam = this.route.snapshot.queryParamMap.get('stripe');
    if (stripeParam === 'success' || stripeParam === 'canceled') {
      this.paymentResult = stripeParam;
    }

    this.performerService.getSubscriptions().subscribe({
      next: (data) => {
        this.subscriptions = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    if (this.paidPlansEnabled) {
      this.api.get<any[]>('/subscription-plans').subscribe((data) => {
        this.plans = data;
        this.cdr.detectChanges();
      });
    }
  }

  pay(planId: string, billingPeriod: 'monthly' | 'yearly') {
    this.paying = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.post<{ url: string }>('/stripe/checkout', { plan_id: planId, billing_period: billingPeriod }).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.error = err.error?.error || 'Došlo je do greške pri pokretanju plaćanja.';
        this.paying = false;
        this.cdr.detectChanges();
      },
    });
  }
}
