import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { PerformerMedia } from '../../models/performer.model';

@Component({
  selector: 'app-performer-video',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './performer-video.component.html',
})
export class PerformerVideoComponent implements OnInit {
  videos: PerformerMedia[] = [];
  loading = true;
  newUrl = '';
  adding = false;
  maxVideos = 999;
  myProfile: any = null;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getMyProfile().subscribe((profile) => {
        this.myProfile = profile;
        this.maxVideos = profile.plan_max_videos || 999;
        this.performerService.getMedia(session.user.id).subscribe((data) => {
          this.videos = data.filter((m) => m.type === 'video');
          this.loading = false;
          this.cdr.detectChanges();
        });
      });
    }
  }

  get atLimit(): boolean {
    return this.videos.length >= this.maxVideos;
  }

  addVideo() {
    if (!this.newUrl) return;
    this.adding = true;
    this.api.post('/performers/me/media', { type: 'video', url: this.newUrl }).subscribe({
      next: (data: any) => {
        this.videos.push(data);
        this.newUrl = '';
        this.adding = false;
        this.cdr.detectChanges();
      },
      error: () => { this.adding = false; this.cdr.detectChanges(); },
    });
  }

  remove(id: string) {
    this.api.delete(`/performers/me/media?id=${id}`).subscribe({
      next: () => {
        this.videos = this.videos.filter((v) => v.id !== id);
        this.cdr.detectChanges();
      },
    });
  }

  getYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }

  getSafeUrl(url: string): SafeResourceUrl | null {
    const id = this.getYoutubeId(url);
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${id}`
    );
  }
}
