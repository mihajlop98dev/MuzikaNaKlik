import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InquiryService } from '../../services/inquiry.service';

@Component({
  selector: 'app-client-inquiries',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './client-inquiries.component.html',
})
export class ClientInquiriesComponent implements OnInit {
  inquiries: any[] = [];
  loading = true;

  constructor(
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.inquiryService.getMine().subscribe({
      next: (data) => { this.inquiries = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
