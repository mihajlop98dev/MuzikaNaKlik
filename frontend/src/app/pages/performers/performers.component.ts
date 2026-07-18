import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PerformerCardComponent } from '../../components/performer-card/performer-card.component';
import { PerformerService } from '../../services/performer.service';
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
  page = 1;
  limit = 12;

  filters: {
    city: string;
    type: string;
    event_type: string;
    price_min: number;
    price_max: number;
    sort: string;
  } = {
    city: '',
    type: '',
    event_type: '',
    price_min: 0,
    price_max: 5000,
    sort: 'popularity',
  };

  constructor(
    private performerService: PerformerService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['city']) this.filters.city = params['city'];
      if (params['event_type']) this.filters.event_type = params['event_type'];
      if (params['type']) this.filters.type = params['type'];
      this.search();
    });
  }

  search() {
    this.loading = true;
    const searchParams: any = { ...this.filters, page: this.page, limit: this.limit };
    this.performerService.search(searchParams).subscribe({
      next: (result) => {
        this.performers = result.data;
        this.totalCount = result.count;
        this.loading = false;
      },
      error: () => (this.loading = false),
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
