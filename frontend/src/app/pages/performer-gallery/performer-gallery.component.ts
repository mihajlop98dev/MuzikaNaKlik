import { Component, OnInit } from '@angular/core';
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

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getMedia(session.user.id).subscribe((data) => {
        this.media = data.filter((m) => m.type === 'image');
        this.loading = false;
      });
    }
  }

  addImage() {
    if (!this.newUrl) return;
    this.adding = true;
    this.api.post('/performers/me/media', { type: 'image', url: this.newUrl }).subscribe({
      next: (data: any) => {
        this.media.push(data);
        this.newUrl = '';
        this.adding = false;
      },
      error: () => (this.adding = false),
    });
  }

  remove(id: string) {
    this.api.delete(`/performers/me/media?id=${id}`).subscribe({
      next: () => {
        this.media = this.media.filter((m) => m.id !== id);
      },
    });
  }
}
