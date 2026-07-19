import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-reviews.component.html',
})
export class AdminReviewsComponent implements OnInit {
  reviews: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/admin/reviews').subscribe({
      next: (data) => { this.reviews = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  toggleVisibility(review: any) {
    const newStatus = review.status === 'visible' ? 'hidden' : 'visible';
    this.api.put('/admin/reviews', { id: review.id, status: newStatus }).subscribe({
      next: () => { review.status = newStatus; this.cdr.detectChanges(); },
    });
  }
}
