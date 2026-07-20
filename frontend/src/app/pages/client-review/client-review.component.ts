import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-client-review',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './client-review.component.html',
})
export class ClientReviewComponent implements OnInit {
  performerId = '';
  inquiryId = '';
  rating = 5;
  comment = '';
  submitted = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.performerId = this.route.snapshot.paramMap.get('performerId') || '';
    this.inquiryId = this.route.snapshot.paramMap.get('inquiryId') || '';
    if (!this.performerId || !this.inquiryId) {
      this.router.navigate(['/']);
    }
  }

  submit() {
    this.reviewService.submitReview(this.performerId, this.inquiryId, this.rating, this.comment).subscribe({
      next: () => { this.submitted = true; this.cdr.detectChanges(); },
      error: (err) => { this.error = err.error?.error || 'Greška.'; this.cdr.detectChanges(); },
    });
  }
}
