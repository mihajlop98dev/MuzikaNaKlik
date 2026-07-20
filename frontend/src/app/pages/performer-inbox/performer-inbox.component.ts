import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InquiryService } from '../../services/inquiry.service';
import { Inquiry } from '../../models/performer.model';

@Component({
  selector: 'app-performer-inbox',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink],
  templateUrl: './performer-inbox.component.html',
})
export class PerformerInboxComponent implements OnInit {
  inquiries: Inquiry[] = [];
  loading = true;

  constructor(
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.inquiryService.getMyInquiries().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
