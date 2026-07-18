import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent implements OnInit {
  favorites: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/favorites').subscribe({
      next: (data) => { this.favorites = data; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  remove(performerId: string) {
    this.api.post('/favorites', { performer_id: performerId }).subscribe({
      next: () => { this.favorites = this.favorites.filter(f => f.performer_id !== performerId); },
    });
  }
}
