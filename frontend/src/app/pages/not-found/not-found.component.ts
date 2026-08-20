import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Catch-all for unmatched routes.
 *
 * Without it the router matched nothing and rendered an empty page — a typo'd
 * or stale link looked like the site was broken rather than like a wrong
 * address. The server cannot answer 404 here either: everything falls through
 * to index.html, so the SPA has to say it.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="wrap" style="text-align:center;padding:64px 0">
        <div style="font-size:64px;margin-bottom:16px">🎻</div>
        <h1 style="font-size:26px;margin-bottom:8px">Stranica nije pronađena</h1>
        <p class="muted" style="margin-bottom:24px">
          Adresa koju si otvorio/la ne postoji, ili je stranica u međuvremenu uklonjena.
        </p>
        <a routerLink="/" class="btn btn-gold">Nazad na početnu</a>
        <a routerLink="/izvodjaci" class="btn" style="border:1px solid var(--card-border);margin-left:10px">
          Pregledaj izvođače
        </a>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
