import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Performer } from '../../models/performer.model';
import { ApiService } from '../../services/api.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-performer-card',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './performer-card.component.html',
})
export class PerformerCardComponent implements OnInit {
  @Input({ required: true }) performer!: Performer;
  @Input() featured = false;
  isLoggedIn = false;
  favorited = false;

  constructor(
    private api: ApiService,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    this.isLoggedIn = !!session;
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    if (!this.isLoggedIn) return;
    this.api.post('/favorites', { performer_id: this.performer.id }).subscribe({
      next: (res: any) => { this.favorited = res.favorited; this.cdr.detectChanges(); },
    });
  }
}
