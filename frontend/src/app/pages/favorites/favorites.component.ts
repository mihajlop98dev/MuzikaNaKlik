import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  templateUrl: './favorites.component.html',
})
export class FavoritesComponent implements OnInit {
  favorites: any[] = [];
  loading = true;

  constructor(
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.favoritesService.getMine().subscribe({
      next: (data) => { this.favorites = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  remove(performerId: string) {
    this.favoritesService.toggle(performerId).subscribe({
      next: () => { this.favorites = this.favorites.filter(f => f.performer_id !== performerId); this.cdr.detectChanges(); },
    });
  }
}
