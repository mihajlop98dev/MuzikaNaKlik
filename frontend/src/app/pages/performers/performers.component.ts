import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerformerCardComponent } from '../../components/performer-card/performer-card.component';
import { PerformerService } from '../../services/performer.service';
import { SupabaseService } from '../../services/supabase.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performers',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, PerformerCardComponent],
  templateUrl: './performers.component.html',
})
export class PerformersComponent implements OnInit {
  performers: Performer[] = [];
  totalCount = 0;
  loading = true;
  isLoggedIn = false;
  page = 1;
  limit = 12;

  filters: {
    q: string;
    city: string;
    type: string;
    event_type: string;
    event_date: string;
    price_min: number;
    price_max: number;
    sort: string;
  } = {
    q: '',
    city: '',
    type: '',
    event_type: '',
    event_date: '',
    price_min: 0,
    price_max: 5000,
    sort: 'popularity',
  };

  constructor(
    private performerService: PerformerService,
    private supabase: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    this.isLoggedIn = !!session;

    this.route.queryParams.subscribe((params) => {
      if (params['q']) this.filters.q = params['q'];
      if (params['city']) this.filters.city = params['city'];
      if (params['event_type']) this.filters.event_type = params['event_type'];
      if (params['type']) this.filters.type = params['type'];
      if (params['event_date'] && this.isLoggedIn) this.filters.event_date = params['event_date'];
      this.search();
    });
  }

  search() {
    this.loading = true;
    const searchParams: any = { ...this.filters, page: this.page, limit: this.limit };
    if (searchParams.price_min === 0) delete searchParams.price_min;
    if (searchParams.price_max === 5000) delete searchParams.price_max;
    if (!this.isLoggedIn || !searchParams.event_date) delete searchParams.event_date;
    this.performerService.search(searchParams).subscribe({
      next: (result) => {
        this.performers = result.data;
        this.totalCount = result.count;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  applyFilters() {
    this.page = 1;
    this.search();
  }

  changePage(delta: number) {
    this.page += delta;
    this.search();
  }

  totalPages() {
    return Math.ceil(this.totalCount / this.limit);
  }
}
