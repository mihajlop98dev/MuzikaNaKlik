import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SearchPanelComponent } from '../../components/search-panel/search-panel.component';
import { PerformerCardComponent } from '../../components/performer-card/performer-card.component';
import { PerformerService } from '../../services/performer.service';
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

  constructor(private performerService: PerformerService) {}

  ngOnInit() {
    this.performerService.getFeatured().subscribe({
      next: (data) => {
        this.featuredPerformers = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
