import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PerformerService } from '../../services/performer.service';
import { Performer, PerformerMedia, Review } from '../../models/performer.model';

@Component({
  selector: 'app-performer-profile',
  standalone: true,
  imports: [NgFor, NgIf, NgSwitch, NgSwitchCase, RouterLink],
  templateUrl: './performer-profile.component.html',
})
export class PerformerProfileComponent implements OnInit {
  performer?: Performer;
  media: PerformerMedia[] = [];
  reviews: Review[] = [];
  activeTab = 'about';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private performerService: PerformerService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });

    this.performerService.getMedia(id).subscribe((data) => (this.media = data));
    this.performerService.getReviews(id).subscribe((data) => (this.reviews = data));
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  get images() {
    return this.media.filter((m) => m.type === 'image');
  }

  get videos() {
    return this.media.filter((m) => m.type === 'video');
  }

  getYoutubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }
}
