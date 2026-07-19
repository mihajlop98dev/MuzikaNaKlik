import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { PerformerMedia } from '../../models/performer.model';

@Component({
  selector: 'app-performer-gallery',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './performer-gallery.component.html',
})
export class PerformerGalleryComponent implements OnInit {
  media: PerformerMedia[] = [];
  loading = true;
  newUrl = '';
  adding = false;
  maxImages = 999;
  myProfile: any = null;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getMyProfile().subscribe((profile) => {
        this.myProfile = profile;
        this.maxImages = profile.plan_max_images || 999;
        this.performerService.getMedia(session.user.id).subscribe((data) => {
          this.media = data.filter((m) => m.type === 'image');
          this.loading = false;
          this.cdr.detectChanges();
        });
      });
    }
  }

  get atLimit(): boolean {
    return this.media.length >= this.maxImages;
  }

  async uploadImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'profiles');
    formData.append('folder', 'gallery');

    this.adding = true;
    this.api.post<{ url: string }>('/storage/upload', formData).subscribe({
      next: (res) => {
        this.api.post('/performers/me/media', { type: 'image', url: res.url }).subscribe({
          next: (data: any) => {
            this.media.push(data);
            this.adding = false;
            this.cdr.detectChanges();
          },
          error: () => { this.adding = false; this.cdr.detectChanges(); },
        });
      },
      error: () => { this.adding = false; this.cdr.detectChanges(); },
    });
  }

  addImage() {
    if (!this.newUrl) return;
    this.adding = true;
    this.api.post('/performers/me/media', { type: 'image', url: this.newUrl }).subscribe({
      next: (data: any) => {
        this.media.push(data);
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
        this.media = this.media.filter((m) => m.id !== id);
        this.cdr.detectChanges();
      },
    });
  }
}
