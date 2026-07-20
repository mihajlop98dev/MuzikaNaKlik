import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SearchPanelComponent } from '../../components/search-panel/search-panel.component';
import { PerformerCardComponent } from '../../components/performer-card/performer-card.component';
import { PerformerService } from '../../services/performer.service';
import { SupabaseService } from '../../services/supabase.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, SearchPanelComponent, PerformerCardComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  featuredPerformers: Performer[] = [];
  loading = true;
  reviews: any[] = [];

  constructor(
    private performerService: PerformerService,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.performerService.getFeatured().subscribe({
      next: (data) => {
        this.featuredPerformers = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.supabase.client
      .from('reviews')
      .select('*, profiles(full_name)')
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { this.reviews = data || []; });
  }
}
