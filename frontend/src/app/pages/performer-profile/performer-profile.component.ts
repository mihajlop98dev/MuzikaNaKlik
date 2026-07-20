import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PerformerService } from '../../services/performer.service';
import { FavoritesService } from '../../services/favorites.service';
import { SupabaseService } from '../../services/supabase.service';
import { Performer, PerformerMedia, PerformerAvailability, Review } from '../../models/performer.model';

@Component({
  selector: 'app-performer-profile',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, RouterLink, DatePipe],
  templateUrl: './performer-profile.component.html',
})
export class PerformerProfileComponent implements OnInit {
  performer?: Performer;
  media: PerformerMedia[] = [];
  reviews: Review[] = [];
  availability: PerformerAvailability[] = [];
  phone: string | null = null;
  activeTab = 'about';
  loading = true;
  isLoggedIn = false;
  favorited = false;

  constructor(
    private route: ActivatedRoute,
    private performerService: PerformerService,
    private favoritesService: FavoritesService,
    private supabase: SupabaseService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    this.isLoggedIn = !!session;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.performerService.getMedia(id).subscribe((data) => {
      this.media = data;
      this.cdr.detectChanges();
    });
    this.performerService.getReviews(id).subscribe((data) => {
      this.reviews = data;
      this.cdr.detectChanges();
    });

    if (this.isLoggedIn) {
      this.performerService.getAvailability(id).subscribe((data) => {
        this.availability = data;
        this.cdr.detectChanges();
      });
      this.performerService.getPerformerPhone(id).subscribe((phone) => {
        this.phone = phone;
        this.cdr.detectChanges();
      });
      this.favoritesService.isFavorited(id).subscribe((favorited) => {
        this.favorited = favorited;
        this.cdr.detectChanges();
      });
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  get images() {
    return this.media.filter((m) => m.type === 'image');
  }

  get videos() {
    return this.media.filter((m) => m.type === 'video');
  }

  get upcomingAvailability() {
    const today = new Date().toISOString().split('T')[0];
    return this.availability
      .filter((a) => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }

  getSafeVideoUrl(url: string): SafeResourceUrl | null {
    const id = this.getYoutubeId(url);
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
  }

  getTypeLabel(): string {
    switch (this.performer?.type) {
      case 'band': return 'Bend';
      case 'dj': return 'DJ';
      case 'singer': return 'Pevač';
      default: return '';
    }
  }

  toggleFavorite() {
    if (!this.isLoggedIn || !this.performer) return;
    this.favoritesService.toggle(this.performer.id).subscribe({
      next: (res) => { this.favorited = res.favorited; this.cdr.detectChanges(); },
    });
  }

  shareProfile() {
    if (navigator.share) {
      navigator.share({
        title: this.performer?.stage_name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }
}
