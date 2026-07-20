import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { InquiryService } from '../../services/inquiry.service';
import { Performer, PerformerAvailability, Review } from '../../models/performer.model';

@Component({
  selector: 'app-performer-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe],
  templateUrl: './performer-dashboard.component.html',
})
export class PerformerDashboardComponent implements OnInit {
  performer?: Performer;
  loading = true;
  unreadInquiries = 0;
  recentReviews: Review[] = [];
  missingProfileItems: string[] = [];
  upcomingBusyDates: PerformerAvailability[] = [];

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private inquiryService: InquiryService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (!session?.user.id) return;
    const id = session.user.id;

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.loading = false;
        this.computeMissingProfileItems();
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.inquiryService.getMyInquiries().subscribe((data) => {
      this.unreadInquiries = data.filter((i) => i.status === 'new').length;
      this.cdr.detectChanges();
    });

    this.performerService.getReviews(id).subscribe((data) => {
      this.recentReviews = data.slice(0, 3);
      this.cdr.detectChanges();
    });

    this.performerService.getMedia(id).subscribe((media) => {
      this.hasImages = media.some((m) => m.type === 'image');
      this.hasVideos = media.some((m) => m.type === 'video');
      this.computeMissingProfileItems();
      this.cdr.detectChanges();
    });

    this.performerService.getAvailability(id).subscribe((data) => {
      const today = new Date().toISOString().split('T')[0];
      this.upcomingBusyDates = data
        .filter((a) => a.status === 'booked' && a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5);
      this.cdr.detectChanges();
    });
  }

  private hasImages = false;
  private hasVideos = false;

  private computeMissingProfileItems() {
    if (!this.performer) return;
    const items: string[] = [];
    if (!this.performer.description) items.push('Nemate opis');
    if (!this.performer.profile_image_url) items.push('Nemate profilnu sliku');
    if (!this.hasImages) items.push('Nemate slike u galeriji');
    if (!this.hasVideos) items.push('Nemate video snimke');
    if (!this.performer.audio_url) items.push('Nemate audio primer');
    if (!this.performer.price_from) items.push('Niste uneli cenu');
    this.missingProfileItems = items;
  }
}
