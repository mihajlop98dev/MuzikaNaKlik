# Phase 2 — Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all public-facing pages — Home, Performer List, Performer Profile, Inquiry Form, Login/Registration.

**Architecture:** Angular standalone components, Next.js API routes for data fetching, Supabase direct queries for public reads.

**Tech Stack:** Angular 22, Tailwind v4, Next.js 15, Supabase.

## File Structure Plan

### Angular Components
```
frontend/src/app/
├── components/
│   ├── header/
│   │   ├── header.component.ts
│   │   └── header.component.html
│   ├── footer/
│   │   ├── footer.component.ts
│   │   └── footer.component.html
│   ├── performer-card/
│   │   ├── performer-card.component.ts
│   │   └── performer-card.component.html
│   ├── search-panel/
│   │   ├── search-panel.component.ts
│   │   └── search-panel.component.html
│   └── review-card/
│       ├── review-card.component.ts
│       └── review-card.component.html
├── pages/
│   ├── home/
│   │   ├── home.component.ts
│   │   └── home.component.html
│   ├── performers/
│   │   ├── performers.component.ts
│   │   └── performers.component.html
│   ├── performer-profile/
│   │   ├── performer-profile.component.ts
│   │   └── performer-profile.component.html
│   ├── inquiry/
│   │   ├── inquiry.component.ts
│   │   └── inquiry.component.html
│   ├── contact/
│   │   ├── contact.component.ts
│   │   └── contact.component.html
│   ├── login/
│   │   ├── login.component.ts
│   │   └── login.component.html
│   └── register/
│       ├── register.component.ts
│       └── register.component.html
├── models/
│   └── performer.model.ts
└── services/
    ├── performer.service.ts
    └── inquiry.service.ts
```

### Next.js API Routes
```
backend/src/app/api/
├── performers/
│   ├── route.ts            (GET — list with filters)
│   ├── [id]/
│   │   └── route.ts        (GET — single performer)
│   └── featured/
│       └── route.ts        (GET — featured for homepage)
├── inquiries/
│   └── route.ts            (POST — create inquiry)
└── auth/
    ├── register/route.ts   (existing)
    ├── login/route.ts      (existing)
    └── me/route.ts         (existing)
```

### Models
```typescript
// frontend/src/app/models/performer.model.ts
export interface Performer {
  id: string;
  stage_name: string;
  type: 'singer' | 'band' | 'dj';
  city: string;
  genres: string[];
  description: string;
  price_from: number;
  rating_avg: number;
  rating_count: number;
  // Joined from profiles
  avatar_url?: string;
}

export interface PerformerMedia {
  id: string;
  performer_id: string;
  type: 'image' | 'video';
  url: string;
  sort_order: number;
}

export interface PerformerAvailability {
  id: string;
  date: string;
  status: 'free' | 'booked';
}

export interface Inquiry {
  id: string;
  performer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  event_type: string;
  event_date: string;
  location: string;
  message: string;
}

export interface Review {
  id: string;
  performer_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
  // Joined from profiles
  client_name?: string;
  client_avatar?: string;
}
```

---

### Task 1: Shared components (Header, Footer)

**Files:**
- Create: `frontend/src/app/components/header/header.component.ts`
- Create: `frontend/src/app/components/header/header.component.html`
- Create: `frontend/src/app/components/footer/footer.component.ts`
- Create: `frontend/src/app/components/footer/footer.component.html`
- Modify: `frontend/src/app/app.component.ts` (add header/footer to shell)
- Modify: `frontend/src/app/app.component.html`

- [ ] **Step 1: Create Header component**

`frontend/src/app/components/header/header.component.ts`:
```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  user$ = this.supabase.user$;

  constructor(private supabase: SupabaseService) {}

  async signOut() {
    await this.supabase.signOut();
  }
}
```

`frontend/src/app/components/header/header.component.html`:
```html
<header class="site-header">
  <div class="wrap header-inner">
    <a routerLink="/" class="logo">
      <span class="logo-icon">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="14" stroke="#D9AE5C" stroke-width="1.4"/>
          <path d="M10 20V11.5C10 10.5 10.7 9.8 11.6 9.6L17 8.4C17.7 8.2 18.4 8.7 18.4 9.5V17" stroke="#D9AE5C" stroke-width="1.4" stroke-linecap="round"/>
          <circle cx="9.5" cy="20.5" r="2.1" stroke="#D9AE5C" stroke-width="1.4"/>
          <circle cx="17.5" cy="18.5" r="2.1" stroke="#D9AE5C" stroke-width="1.4"/>
        </svg>
      </span>
      <span class="logo-text">MUZIKA<br><em>NA KLIK</em></span>
    </a>

    <nav class="main-nav">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Početna</a>
      <a routerLink="/izvodjaci" routerLinkActive="active">Izvođači</a>
      <a routerLink="/kako-funkcionise">Kako funkcioniše</a>
      <a routerLink="/kontakt">Kontakt</a>
    </nav>

    <div class="header-actions">
      <ng-container *ngIf="user$ | async as user; else guestLinks">
        <a routerLink="/moj-nalog" class="link-plain">Moj nalog</a>
        <button class="btn btn-gold" (click)="signOut()">Odjava</button>
      </ng-container>
      <ng-template #guestLinks>
        <a routerLink="/prijava" class="link-plain">Prijava</a>
        <a routerLink="/registracija" class="btn btn-gold">Registracija</a>
      </ng-template>
    </div>
  </div>
</header>
```

- [ ] **Step 2: Create Footer component**

`frontend/src/app/components/footer/footer.component.ts`:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
})
export class FooterComponent {}
```

`frontend/src/app/components/footer/footer.component.html`:
```html
<footer class="site-footer">
  <div class="wrap footer-inner">
    <span class="logo-text small">MUZIKA<em> NA KLIK</em></span>
    <p>&copy; 2026 Muzika na Klik. Sva prava zadržana.</p>
  </div>
</footer>
```

- [ ] **Step 3: Update app component to use header/footer**

`frontend/src/app/app.component.ts`:
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

`frontend/src/app/app.component.html`:
```html
<app-header />
<main>
  <router-outlet />
</main>
<app-footer />
```

- [ ] **Step 4: Add styles**

Add to `frontend/src/styles.css`:
```css
.wrap {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 32px;
}

@media (max-width: 640px) {
  .wrap { padding: 0 18px; }
}
```

Add header/footer styles to `frontend/src/styles.css`:
```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10,10,13,.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 76px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(217,174,92,.08);
}

.logo-text {
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 15px;
  line-height: 1.15;
  letter-spacing: .02em;
}

.logo-text em { font-style: normal; color: var(--gold); display: block; }
.logo-text.small { font-size: 13px; }

.main-nav {
  display: flex;
  gap: 32px;
}

.main-nav a {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  padding: 6px 0;
  border-bottom: 2px solid transparent;
}

.main-nav a:hover { color: var(--text); }
.main-nav a.active { color: var(--gold); border-color: var(--gold); }

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-actions .btn { padding: 10px 20px; font-size: 13px; }

.site-footer {
  padding: 32px 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 13px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
}

.btn-gold {
  background: linear-gradient(180deg, var(--gold-soft), var(--gold));
  color: #1b1409;
}

.btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(217,174,92,.25); }

.link-plain { font-size: 14px; color: var(--text); opacity: .85; }
.link-plain:hover { opacity: 1; }

@media (max-width: 960px) {
  .main-nav { display: none; }
}

@media (max-width: 640px) {
  .header-actions .link-plain { display: none; }
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: add header and footer shared components"
```

---

### Task 2: Models and services (Performer + Inquiry)

**Files:**
- Create: `frontend/src/app/models/performer.model.ts`
- Create: `frontend/src/app/services/performer.service.ts`
- Create: `frontend/src/app/services/inquiry.service.ts`

- [ ] **Step 1: Create Performer model**

`frontend/src/app/models/performer.model.ts`:
```typescript
export interface Performer {
  id: string;
  stage_name: string;
  type: 'singer' | 'band' | 'dj';
  city: string;
  genres: string[];
  description: string;
  price_from: number;
  rating_avg: number;
  rating_count: number;
  avatar_url?: string;
  status: string;
  subscription_status: string;
}

export interface PerformerMedia {
  id: string;
  performer_id: string;
  type: 'image' | 'video';
  url: string;
  sort_order: number;
}

export interface PerformerAvailability {
  id: string;
  date: string;
  status: 'free' | 'booked';
}

export interface Inquiry {
  id?: string;
  performer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  message?: string;
  status?: 'new' | 'read' | 'responded';
  created_at?: string;
}

export interface Review {
  id: string;
  performer_id: string;
  client_id: string;
  rating: number;
  comment: string;
  status: 'visible' | 'hidden';
  created_at: string;
}

export interface PerformerSearchParams {
  city?: string;
  event_date?: string;
  event_type?: string;
  type?: string;
  price_min?: number;
  price_max?: number;
  sort?: string;
  page?: number;
  limit?: number;
}
```

- [ ] **Step 2: Create Performer service**

`frontend/src/app/services/performer.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap } from 'rxjs';
import { Performer, PerformerSearchParams } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class PerformerService {
  constructor(
    private api: ApiService,
    private supabase: SupabaseService
  ) {}

  getFeatured(): Observable<Performer[]> {
    return this.api.get<Performer[]>('/performers/featured');
  }

  search(params: PerformerSearchParams): Observable<{ data: Performer[]; count: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        query.set(key, String(value));
      }
    });
    return this.api.get<{ data: Performer[]; count: number }>(`/performers?${query.toString()}`);
  }

  getById(id: string): Observable<Performer> {
    return this.api.get<Performer>(`/performers/${id}`);
  }

  getMedia(performerId: string) {
    return from(this.supabase.client
      .from('performer_media')
      .select('*')
      .eq('performer_id', performerId)
      .order('sort_order')
    ).pipe(map(({ data }) => data || []));
  }

  getAvailability(performerId: string) {
    return from(this.supabase.client
      .from('performer_availability')
      .select('*')
      .eq('performer_id', performerId)
    ).pipe(map(({ data }) => data || []));
  }

  getReviews(performerId: string) {
    return from(this.supabase.client
      .from('reviews')
      .select('*, profiles!inner(full_name, avatar_url)')
      .eq('performer_id', performerId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
    ).pipe(map(({ data }) => data || []));
  }
}
```

- [ ] **Step 3: Create Inquiry service**

`frontend/src/app/services/inquiry.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Inquiry } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  constructor(private api: ApiService) {}

  create(inquiry: Partial<Inquiry>): Observable<Inquiry> {
    return this.api.post<Inquiry>('/inquiries', inquiry);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/models/ frontend/src/app/services/
git commit -m "feat: add performer and inquiry models and services"
```

---

### Task 3: Performer list API (Next.js)

**Files:**
- Create: `backend/src/app/api/performers/route.ts`
- Create: `backend/src/app/api/performers/featured/route.ts`
- Create: `backend/src/app/api/performers/[id]/route.ts`

- [ ] **Step 1: List performers with filters**

`backend/src/app/api/performers/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const eventType = searchParams.get('event_type');
  const type = searchParams.get('type');
  const priceMin = searchParams.get('price_min');
  const priceMax = searchParams.get('price_max');
  const sort = searchParams.get('sort') || 'rating_avg';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from('performers')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .eq('subscription_status', 'active');

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  if (priceMin) {
    query = query.gte('price_from', parseInt(priceMin));
  }

  if (priceMax) {
    query = query.lte('price_from', parseInt(priceMax));
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('price_from', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price_from', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating_avg', { ascending: false });
      break;
    default:
      query = query.order('rating_count', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [], count: count || 0 });
}
```

- [ ] **Step 2: Featured performers endpoint**

`backend/src/app/api/performers/featured/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('performers')
    .select('*')
    .eq('status', 'approved')
    .eq('subscription_status', 'active')
    .order('rating_count', { ascending: false })
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
```

- [ ] **Step 3: Single performer endpoint**

`backend/src/app/api/performers/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: performer, error } = await supabase
    .from('performers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !performer) {
    return NextResponse.json({ error: 'Performer not found' }, { status: 404 });
  }

  return NextResponse.json(performer);
}
```

- [ ] **Step 4: Create inquiries POST endpoint**

`backend/src/app/api/inquiries/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { performer_id, full_name, email, phone, event_type, event_date, location, message } = body;

    if (!performer_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'performer_id, full_name, and email are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        performer_id,
        full_name,
        email,
        phone,
        event_type,
        event_date,
        location,
        message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Verify build**

```bash
cd backend && npm run build
```

Expected: TypeScript compiles (build may fail at runtime due to missing Supabase env vars).

- [ ] **Step 6: Commit**

```bash
git add backend/src/app/api/
git commit -m "feat: add performers and inquiries API routes"
```

---

### Task 4: Home page with full design

**Files:**
- Create: `frontend/src/app/components/search-panel/search-panel.component.ts`
- Create: `frontend/src/app/components/search-panel/search-panel.component.html`
- Create: `frontend/src/app/components/performer-card/performer-card.component.ts`
- Create: `frontend/src/app/components/performer-card/performer-card.component.html`
- Modify: `frontend/src/app/pages/home/home.component.ts`
- Modify: `frontend/src/app/pages/home/home.component.html`

- [ ] **Step 1: Create SearchPanel component**

`frontend/src/app/components/search-panel/search-panel.component.ts`:
```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-panel.component.html',
})
export class SearchPanelComponent {
  city = '';
  date = '';
  eventType = '';
  performerType = '';

  constructor(private router: Router) {}

  search() {
    const params = new URLSearchParams();
    if (this.city) params.set('city', this.city);
    if (this.eventType) params.set('event_type', this.eventType);
    if (this.performerType) params.set('type', this.performerType);
    this.router.navigate(['/izvodjaci'], { queryParams: Object.fromEntries(params) });
  }
}
```

`frontend/src/app/components/search-panel/search-panel.component.html`:
```html
<form class="search-panel" (ngSubmit)="search()">
  <div class="field">
    <label>Izaberi grad</label>
    <div class="field-control">
      <input type="text" placeholder="Npr. Beograd" [(ngModel)]="city" name="city">
    </div>
  </div>
  <div class="field">
    <label>Vrsta događaja</label>
    <div class="field-control">
      <select [(ngModel)]="eventType" name="eventType">
        <option value="">Sve</option>
        <option value="svadba">Svadba</option>
        <option value="rodjendan">Rođendan</option>
        <option value="krstenje">Krštenje</option>
        <option value="korporativni">Korporativni</option>
        <option value="maturska">Maturska večer</option>
        <option value="drugo">Drugo</option>
      </select>
    </div>
  </div>
  <div class="field">
    <label>Izvođač</label>
    <div class="field-control">
      <select [(ngModel)]="performerType" name="performerType">
        <option value="">Svi</option>
        <option value="singer">Pevač</option>
        <option value="band">Bend</option>
        <option value="dj">DJ</option>
      </select>
    </div>
  </div>
  <button type="submit" class="btn btn-gold search-btn">Pronađi muziku</button>
</form>
```

- [ ] **Step 2: Create PerformerCard component**

`frontend/src/app/components/performer-card/performer-card.component.ts`:
```typescript
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './performer-card.component.html',
})
export class PerformerCardComponent {
  @Input({ required: true }) performer!: Performer;
  @Input() featured = false;
}
```

`frontend/src/app/components/performer-card/performer-card.component.html`:
```html
<article class="performer-card">
  <div class="performer-media">
    <span class="badge" *ngIf="featured">Top izbor</span>
    <button class="fav" (click)="$event.stopPropagation()" aria-label="Sačuvaj">♡</button>
    <img [src]="performer.avatar_url || 'https://picsum.photos/seed/' + performer.id + '/380/460'" [alt]="performer.stage_name">
  </div>
  <div class="performer-body">
    <h3>{{ performer.stage_name }}</h3>
    <p class="performer-city">{{ performer.city }}</p>
    <div class="performer-meta">
      <span class="rating">★ {{ performer.rating_avg.toFixed(1) }} <em>({{ performer.rating_count }})</em></span>
      <span class="price">od {{ performer.price_from }} €</span>
    </div>
    <a routerLink="/izvodjac/{{ performer.id }}" class="performer-link">Pogledaj profil</a>
  </div>
</article>
```

- [ ] **Step 3: Update Home page**

`frontend/src/app/pages/home/home.component.ts`:
```typescript
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
```

`frontend/src/app/pages/home/home.component.html`:
```html
<!-- HERO -->
<section class="hero">
  <div class="hero-media" aria-hidden="true"></div>
  <div class="hero-scrim" aria-hidden="true"></div>

  <div class="wrap hero-inner">
    <h1 class="hero-title">Pronađi idealnu<br><span class="accent">muziku</span> za svaku<br>proslavu.</h1>
    <p class="hero-sub">Pevači, bendovi i DJ-evi za svadbe, rođendane, krštenja, korporativne događaje i druge proslave.</p>

    <app-search-panel />

    <div class="quick-filters">
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'svadba'}" class="chip">Svadba</a>
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'rodjendan'}" class="chip">Rođendan</a>
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'krstenje'}" class="chip">Krštenje</a>
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'korporativni'}" class="chip">Korporativni događaj</a>
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'maturska'}" class="chip">Maturska večer</a>
      <a routerLink="/izvodjaci" [queryParams]="{event_type: 'drugo'}" class="chip">Drugo</a>
    </div>
  </div>
</section>

<!-- ISTAKNUTI IZVOĐAČI -->
<section class="section" id="izvodjaci">
  <div class="wrap">
    <div class="section-head">
      <h2>Istaknuti izvođači</h2>
      <a routerLink="/izvodjaci" class="link-arrow">Pogledaj sve →</a>
    </div>

    <div class="performer-grid" *ngIf="!loading; else loadingState">
      <app-performer-card
        *ngFor="let p of featuredPerformers"
        [performer]="p"
        [featured]="true"
      />
    </div>
    <ng-template #loadingState>
      <p class="muted">Učitavanje...</p>
    </ng-template>
  </div>
</section>

<!-- KAKO FUNKCIONIŠE -->
<section class="section alt" id="kako">
  <div class="wrap">
    <div class="section-head center">
      <h2>Kako funkcioniše?</h2>
      <p class="muted">Tri jednostavna koraka do savršene muzike</p>
    </div>

    <div class="steps">
      <div class="step">
        <span class="step-num">1</span>
        <h3>Pretraži</h3>
        <p>Izaberi grad, datum, vrstu događaja i pronađi idealne izvođače.</p>
      </div>
      <div class="step">
        <span class="step-num">2</span>
        <h3>Pošalji upit</h3>
        <p>Pošalji upit izvođačima koji ti se najviše dopadaju.</p>
      </div>
      <div class="step">
        <span class="step-num">3</span>
        <h3>Rezerviši</h3>
        <p>Dogovori detalje i rezerviši izvođača za svoju proslavu.</p>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="wrap cta-inner">
    <div>
      <h2>Spremni da pronađete idealnu muziku<br>za vašu proslavu?</h2>
      <a routerLink="/izvodjaci" class="btn btn-gold">Pronađi muziku</a>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add home page styles**

Add to `frontend/src/styles.css`:
```css
.hero {
  position: relative;
  min-height: 620px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-media {
  position: absolute;
  inset: 0;
  background: url("https://picsum.photos/seed/concertstage/1600/900") center 25% / cover no-repeat;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(10,10,13,.97) 10%, rgba(10,10,13,.75) 45%, rgba(10,10,13,.35) 100%),
    linear-gradient(0deg, rgba(10,10,13,1) 0%, rgba(10,10,13,.2) 40%);
}

.hero-inner {
  position: relative;
  z-index: 2;
  padding-top: 64px;
  padding-bottom: 64px;
  max-width: 780px;
}

.hero-title {
  font-size: 48px;
  line-height: 1.12;
  margin-bottom: 20px;
}

.hero-title .accent { color: var(--gold); }

.hero-sub {
  color: var(--text-muted);
  font-size: 16px;
  margin-bottom: 32px;
  max-width: 520px;
}

.search-panel {
  display: flex;
  align-items: flex-end;
  gap: 0;
  background: rgba(23,22,27,.9);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 14px;
  backdrop-filter: blur(6px);
  flex-wrap: wrap;
}

.field {
  flex: 1 1 170px;
  padding: 4px 18px;
  border-right: 1px solid rgba(255,255,255,.08);
  min-width: 150px;
}

.field:last-of-type { border-right: none; }

.field label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.field-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-control input,
.field-control select {
  background: none;
  border: none;
  color: var(--text);
  font-size: 14px;
  width: 100%;
  outline: none;
  appearance: none;
}

.field-control input::placeholder { color: #6f6d74; }
.field-control select option { background: var(--card); color: var(--text); }

.search-btn {
  margin: 4px;
  flex-shrink: 0;
  padding: 16px 26px;
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.chip {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  font-size: 13px;
  color: var(--text-muted);
  background: rgba(255,255,255,.02);
  transition: all .15s ease;
}

.chip:hover { border-color: var(--gold); color: var(--gold); }

.section {
  padding: 80px 0;
}

.section.alt { background: var(--bg-alt); }

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 36px;
}

.section-head h2 { font-size: 28px; }

.section-head.center {
  flex-direction: column;
  text-align: center;
  gap: 8px;
}

.muted { color: var(--text-muted); font-size: 15px; }

.performer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.performer-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform .18s ease, border-color .18s ease;
}

.performer-card:hover {
  transform: translateY(-4px);
  border-color: rgba(217,174,92,.4);
}

.performer-media {
  position: relative;
  aspect-ratio: 4/3;
}

.performer-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  background: var(--gold);
  color: #1b1409;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: .02em;
}

.fav {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(10,10,13,.55);
  color: #fff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fav:hover { color: var(--gold); }

.performer-body { padding: 16px 18px 20px; }
.performer-body h3 { font-size: 16px; margin-bottom: 3px; }
.performer-city { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }

.performer-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;
}

.rating { color: var(--gold-soft); font-weight: 600; }
.rating em { color: var(--text-muted); font-style: normal; font-weight: 400; margin-left: 2px; }
.price { color: var(--text); font-weight: 600; }

.performer-link {
  display: block;
  text-align: center;
  margin-top: 12px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(217,174,92,.1);
  color: var(--gold);
  font-size: 13px;
  font-weight: 600;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.step {
  position: relative;
  text-align: center;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 40px 24px 30px;
}

.step-num {
  position: absolute;
  top: 16px;
  right: 20px;
  color: rgba(255,255,255,.15);
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 26px;
}

.step h3 { font-size: 17px; margin-bottom: 8px; }
.step p { color: var(--text-muted); font-size: 14px; }

.cta {
  background:
    linear-gradient(90deg, rgba(10,10,13,.95), rgba(10,10,13,.65)),
    url("https://picsum.photos/seed/micclose/1400/500") center / cover no-repeat;
  border-top: 1px solid var(--card-border);
  border-bottom: 1px solid var(--card-border);
}

.cta-inner {
  padding: 70px 0;
}

.cta h2 {
  font-size: 26px;
  margin-bottom: 24px;
  max-width: 480px;
}

@media (max-width: 960px) {
  .performer-grid { grid-template-columns: repeat(2, 1fr); }
  .steps { grid-template-columns: 1fr; }
  .hero-title { font-size: 36px; }
}

@media (max-width: 640px) {
  .performer-grid { grid-template-columns: 1fr; }
  .search-panel { flex-direction: column; align-items: stretch; }
  .field { border-right: none; border-bottom: 1px solid rgba(255,255,255,.08); padding: 10px 4px; }
  .search-btn { width: 100%; }
  .cta h2 { font-size: 21px; }
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/components/ frontend/src/app/pages/home/ frontend/src/styles.css
git commit -m "feat: implement home page with hero, search, performer cards, and CTA"
```

---

### Task 5: Performer list page with filters

**Files:**
- Create: `frontend/src/app/pages/performers/performers.component.ts`
- Create: `frontend/src/app/pages/performers/performers.component.html`

- [ ] **Step 1: Create performers list component**

`frontend/src/app/pages/performers/performers.component.ts`:
```typescript
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

  filters = {
    city: '',
    event_type: '',
    type: '',
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
    this.performerService.search({ ...this.filters, page: this.page, limit: this.limit }).subscribe({
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
```

`frontend/src/app/pages/performers/performers.component.html`:
```html
<section class="section">
  <div class="wrap">
    <div class="performers-layout">
      <aside class="filters-sidebar">
        <h3>Filteri</h3>

        <div class="filter-group">
          <label>Grad</label>
          <input type="text" [(ngModel)]="filters.city" placeholder="Npr. Beograd" class="filter-input">
        </div>

        <div class="filter-group">
          <label>Vrsta događaja</label>
          <select [(ngModel)]="filters.event_type" class="filter-input">
            <option value="">Svi</option>
            <option value="svadba">Svadba</option>
            <option value="rodjendan">Rođendan</option>
            <option value="krstenje">Krštenje</option>
            <option value="korporativni">Korporativni</option>
            <option value="maturska">Maturska večer</option>
            <option value="drugo">Drugo</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Tip izvođača</label>
          <select [(ngModel)]="filters.type" class="filter-input">
            <option value="">Svi</option>
            <option value="singer">Pevač</option>
            <option value="band">Bend</option>
            <option value="dj">DJ</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Sortiranje</label>
          <select [(ngModel)]="filters.sort" class="filter-input">
            <option value="popularity">Popularnost</option>
            <option value="price_asc">Cena: rastuće</option>
            <option value="price_desc">Cena: opadajuće</option>
            <option value="rating">Ocena</option>
          </select>
        </div>

        <button class="btn btn-gold" (click)="applyFilters()">Primeni filtere</button>
      </aside>

      <div class="performers-content">
        <p class="muted" *ngIf="!loading">Prikazano {{ performers.length }} od {{ totalCount }} izvođača</p>

        <div class="performer-grid" *ngIf="!loading && performers.length > 0; else emptyState">
          <app-performer-card *ngFor="let p of performers" [performer]="p" />
        </div>
        <ng-template #emptyState>
          <p class="muted" *ngIf="!loading">Nema izvođača koji odgovaraju kriterijumima.</p>
        </ng-template>

        <div class="pagination" *ngIf="totalPages() > 1">
          <button class="btn" [disabled]="page <= 1" (click)="changePage(-1)">Prethodna</button>
          <span class="page-info">Stranica {{ page }} od {{ totalPages() }}</span>
          <button class="btn" [disabled]="page >= totalPages()" (click)="changePage(1)">Sledeća</button>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add filters styles**

Add to `frontend/src/styles.css`:
```css
.performers-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
}

.filters-sidebar {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 24px;
  height: fit-content;
}

.filters-sidebar h3 {
  font-size: 17px;
  margin-bottom: 20px;
}

.filter-group {
  margin-bottom: 18px;
}

.filter-group label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.filter-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  outline: none;
}

.filter-input:focus {
  border-color: var(--gold);
}

.filters-sidebar .btn {
  width: 100%;
  margin-top: 8px;
}

.performers-content {
  min-height: 400px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.pagination .btn {
  border: 1px solid var(--card-border);
  color: var(--text);
}

.pagination .btn:disabled {
  opacity: .4;
  cursor: default;
}

.page-info {
  font-size: 14px;
  color: var(--text-muted);
}

@media (max-width: 960px) {
  .performers-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Update routes**

Modify `frontend/src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'izvodjaci', loadComponent: () => import('./pages/performers/performers.component').then(m => m.PerformersComponent) },
  { path: 'prijava', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registracija', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
];
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/performers/ frontend/src/app/app.routes.ts frontend/src/styles.css
git commit -m "feat: implement performers list page with filters and pagination"
```

---

### Task 6: Performer profile page with tabs

**Files:**
- Create: `frontend/src/app/pages/performer-profile/performer-profile.component.ts`
- Create: `frontend/src/app/pages/performer-profile/performer-profile.component.html`

- [ ] **Step 1: Create performer profile component**

`frontend/src/app/pages/performer-profile/performer-profile.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PerformerService } from '../../services/performer.service';
import { Performer, PerformerMedia, Review } from '../../models/performer.model';

@Component({
  selector: 'app-performer-profile',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink],
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

  get youtubeId() {
    return (url: string) => {
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      return match ? match[1] : null;
    };
  }
}
```

`frontend/src/app/pages/performer-profile/performer-profile.component.html`:
```html
<section class="section" *ngIf="!loading && performer; else loadingState">
  <div class="wrap">
    <div class="profile-header">
      <div class="profile-info">
        <h1>{{ performer.stage_name }}</h1>
        <p class="performer-city">{{ performer.city }}</p>
        <div class="performer-meta">
          <span class="rating">★ {{ performer.rating_avg.toFixed(1) }} <em>({{ performer.rating_count }} recenzija)</em></span>
          <span class="price">od {{ performer.price_from }} €</span>
        </div>
        <div class="profile-actions">
          <a routerLink="/upit/{{ performer.id }}" class="btn btn-gold">Pošalji upit</a>
          <button class="btn fav-btn">♡ Sačuvaj</button>
        </div>
      </div>
    </div>

    <div class="profile-tabs">
      <button
        *ngFor="let tab of ['about', 'gallery', 'video', 'reviews']"
        class="tab-btn"
        [class.active]="activeTab === tab"
        (click)="setTab(tab)"
      >
        {{ tab === 'about' ? 'O nama' : tab === 'gallery' ? 'Galerija' : tab === 'video' ? 'Video' : 'Recenzije' }}
      </button>
    </div>

    <div class="tab-content" [ngSwitch]="activeTab">
      <div *ngSwitchCase="'about'">
        <div class="about-section">
          <h3>O nama</h3>
          <p>{{ performer.description || 'Opis nije dostupan.' }}</p>
        </div>
        <div class="about-section">
          <h3>Žanrovi</h3>
          <p>{{ performer.genres?.join(', ') || 'Nije navedeno.' }}</p>
        </div>
      </div>

      <div *ngSwitchCase="'gallery'">
        <div class="gallery-grid" *ngIf="images.length > 0; else noContent">
          <img *ngFor="let img of images" [src]="img.url" alt="Gallery image" class="gallery-img">
        </div>
      </div>

      <div *ngSwitchCase="'video'">
        <div class="video-grid" *ngIf="videos.length > 0; else noContent">
          <div *ngFor="let v of videos" class="video-embed">
            <iframe
              *ngIf="youtubeId(v.url)"
              [src]="'https://www.youtube.com/embed/' + youtubeId(v.url)"
              frameborder="0"
              allowfullscreen>
            </iframe>
          </div>
        </div>
      </div>

      <div *ngSwitchCase="'reviews'">
        <div class="reviews-list" *ngIf="reviews.length > 0; else noContent">
          <div *ngFor="let r of reviews" class="review-item">
            <div class="review-header">
              <strong>{{ r.rating }}/5</strong>
              <span>{{ r.created_at | date }}</span>
            </div>
            <p>{{ r.comment }}</p>
          </div>
        </div>
      </div>

      <ng-template #noContent>
        <p class="muted">Nema sadržaja.</p>
      </ng-template>
    </div>
  </div>
</section>

<ng-template #loadingState>
  <section class="section"><div class="wrap"><p class="muted">Učitavanje...</p></div></section>
</ng-template>
```

- [ ] **Step 2: Add profile styles**

Add to `frontend/src/styles.css`:
```css
.profile-header {
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
}

.profile-info h1 { font-size: 32px; margin-bottom: 8px; }

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.fav-btn {
  border: 1px solid var(--card-border);
  color: var(--text);
  padding: 12px 20px;
  border-radius: 8px;
}

.profile-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--card-border);
  margin-bottom: 28px;
}

.tab-btn {
  padding: 12px 24px;
  font-size: 14px;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--gold);
  border-color: var(--gold);
}

.about-section {
  margin-bottom: 24px;
}

.about-section h3 {
  font-size: 17px;
  margin-bottom: 8px;
}

.about-section p {
  color: var(--text-muted);
  line-height: 1.7;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gallery-img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 8px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.video-embed {
  aspect-ratio: 16/9;
}

.video-embed iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--gold-soft);
}

.review-header span {
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 640px) {
  .gallery-grid { grid-template-columns: 1fr 1fr; }
  .video-grid { grid-template-columns: 1fr; }
  .profile-header { flex-direction: column; }
}
```

- [ ] **Step 3: Update routes**

Modify `frontend/src/app/app.routes.ts`:
```typescript
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'izvodjaci', loadComponent: () => import('./pages/performers/performers.component').then(m => m.PerformersComponent) },
  { path: 'izvodjac/:id', loadComponent: () => import('./pages/performer-profile/performer-profile.component').then(m => m.PerformerProfileComponent) },
  { path: 'prijava', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registracija', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
];
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/performer-profile/ frontend/src/app/app.routes.ts frontend/src/styles.css
git commit -m "feat: implement performer profile page with tabs"
```

---

### Task 7: Inquiry form page

**Files:**
- Create: `frontend/src/app/pages/inquiry/inquiry.component.ts`
- Create: `frontend/src/app/pages/inquiry/inquiry.component.html`

- [ ] **Step 1: Create inquiry component**

`frontend/src/app/pages/inquiry/inquiry.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InquiryService } from '../../services/inquiry.service';
import { PerformerService } from '../../services/performer.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './inquiry.component.html',
})
export class InquiryComponent implements OnInit {
  performer?: Performer;
  performerLoading = true;
  submitted = false;
  error = '';

  form = {
    full_name: '',
    email: '',
    phone: '',
    event_type: '',
    event_date: '',
    location: '',
    message: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inquiryService: InquiryService,
    private performerService: PerformerService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.performerLoading = false;
      },
      error: () => {
        this.performerLoading = false;
        this.router.navigate(['/']);
      },
    });
  }

  submit() {
    if (!this.form.full_name || !this.form.email) return;

    this.inquiryService
      .create({ ...this.form, performer_id: this.performer!.id })
      .subscribe({
        next: () => {
          this.submitted = true;
        },
        error: (err) => {
          this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        },
      });
  }
}
```

`frontend/src/app/pages/inquiry/inquiry.component.html`:
```html
<section class="section">
  <div class="wrap">
    <div class="inquiry-layout" *ngIf="!submitted; else successState">
      <div class="inquiry-form">
        <h2>Pošalji upit</h2>
        <p class="muted" style="margin-bottom:24px">Popunite formu i izvođač će vas kontaktirati.</p>

        <div class="form-group">
          <label>Ime i prezime *</label>
          <input type="text" [(ngModel)]="form.full_name" class="form-input" placeholder="Vaše ime i prezime">
        </div>

        <div class="form-group">
          <label>Email *</label>
          <input type="email" [(ngModel)]="form.email" class="form-input" placeholder="vas@email.com">
        </div>

        <div class="form-group">
          <label>Telefon</label>
          <input type="tel" [(ngModel)]="form.phone" class="form-input" placeholder="+381 6X XXX XXXX">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Vrsta događaja</label>
            <select [(ngModel)]="form.event_type" class="form-input">
              <option value="">Izaberite</option>
              <option value="svadba">Svadba</option>
              <option value="rodjendan">Rođendan</option>
              <option value="krstenje">Krštenje</option>
              <option value="korporativni">Korporativni događaj</option>
              <option value="maturska">Maturska večer</option>
              <option value="drugo">Drugo</option>
            </select>
          </div>
          <div class="form-group">
            <label>Datum događaja</label>
            <input type="date" [(ngModel)]="form.event_date" class="form-input">
          </div>
        </div>

        <div class="form-group">
          <label>Lokacija</label>
          <input type="text" [(ngModel)]="form.location" class="form-input" placeholder="Grad, mesto">
        </div>

        <div class="form-group">
          <label>Poruka</label>
          <textarea [(ngModel)]="form.message" class="form-input form-textarea" placeholder="Vaša poruka..." rows="4"></textarea>
        </div>

        <p class="error-text" *ngIf="error">{{ error }}</p>

        <button class="btn btn-gold" (click)="submit()" [disabled]="!form.full_name || !form.email">
          Pošalji upit
        </button>
      </div>

      <aside class="inquiry-sidebar" *ngIf="performer">
        <div class="inquiry-performer-card">
          <img [src]="'https://picsum.photos/seed/' + performer.id + '/200/200'" [alt]="performer.stage_name" class="inquiry-performer-img">
          <h3>{{ performer.stage_name }}</h3>
          <p class="performer-city">{{ performer.city }}</p>
          <div class="performer-meta">
            <span class="rating">★ {{ performer.rating_avg.toFixed(1) }}</span>
            <span class="price">od {{ performer.price_from }} €</span>
          </div>
        </div>
      </aside>
    </div>

    <ng-template #successState>
      <div class="success-message">
        <h2>Upit je poslat!</h2>
        <p class="muted">Izvođač će vas kontaktirati u najkraćem mogućem roku.</p>
        <a routerLink="/" class="btn btn-gold">Nazad na početnu</a>
      </div>
    </ng-template>
  </div>
</section>
```

- [ ] **Step 2: Add inquiry styles**

Add to `frontend/src/styles.css`:
```css
.inquiry-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
}

.inquiry-form h2 { font-size: 24px; margin-bottom: 4px; }

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color .15s ease;
}

.form-input:focus {
  border-color: var(--gold);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 12px;
}

.inquiry-performer-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
}

.inquiry-performer-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
}

.success-message {
  text-align: center;
  padding: 80px 0;
}

.success-message h2 {
  font-size: 28px;
  margin-bottom: 12px;
}

.success-message .btn {
  margin-top: 24px;
}

@media (max-width: 960px) {
  .inquiry-layout {
    grid-template-columns: 1fr;
  }

  .inquiry-sidebar {
    order: -1;
  }
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Update routes**

Modify `frontend/src/app/app.routes.ts`:
```typescript
export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'izvodjaci', loadComponent: () => import('./pages/performers/performers.component').then(m => m.PerformersComponent) },
  { path: 'izvodjac/:id', loadComponent: () => import('./pages/performer-profile/performer-profile.component').then(m => m.PerformerProfileComponent) },
  { path: 'upit/:id', loadComponent: () => import('./pages/inquiry/inquiry.component').then(m => m.InquiryComponent) },
  { path: 'prijava', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registracija', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
];
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/inquiry/ frontend/src/app/app.routes.ts frontend/src/styles.css
git commit -m "feat: implement inquiry form page"
```

---

### Task 8: Login and Registration pages

**Files:**
- Modify: `frontend/src/app/pages/login/login.component.ts`
- Modify: `frontend/src/app/pages/login/login.component.html`
- Modify: `frontend/src/app/pages/register/register.component.ts`
- Modify: `frontend/src/app/pages/register/register.component.html`

- [ ] **Step 1: Implement Login page**

`frontend/src/app/pages/login/login.component.ts`:
```typescript
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async login() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    const { error } = await this.supabase.signIn(this.email, this.password);

    if (error) {
      this.error = error.message;
      this.loading = false;
      return;
    }

    this.router.navigate(['/']);
  }

  async loginWithGoogle() {
    await this.supabase.signInWithGoogle();
  }
}
```

`frontend/src/app/pages/login/login.component.html`:
```html
<section class="section">
  <div class="wrap">
    <div class="auth-form">
      <h2>Prijava</h2>
      <p class="muted">Dobrodošli nazad!</p>

      <div class="form-group">
        <label>Email</label>
        <input type="email" [(ngModel)]="email" class="form-input" placeholder="vas@email.com">
      </div>

      <div class="form-group">
        <label>Lozinka</label>
        <input type="password" [(ngModel)]="password" class="form-input" placeholder="********">
      </div>

      <p class="error-text" *ngIf="error">{{ error }}</p>

      <button class="btn btn-gold auth-btn" (click)="login()" [disabled]="loading">
        {{ loading ? 'Prijavljivanje...' : 'Prijavi se' }}
      </button>

      <div class="auth-divider">ili</div>

      <button class="btn auth-btn google-btn" (click)="loginWithGoogle()">
        Nastavi sa Google-om
      </button>

      <p class="auth-link">
        Nemaš nalog? <a routerLink="/registracija">Registruj se</a>
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Implement Register page**

`frontend/src/app/pages/register/register.component.ts`:
```typescript
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  email = '';
  password = '';
  role: 'client' | 'performer' = 'client';
  stageName = '';
  performerType = '';
  error = '';
  loading = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async register() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    const metadata: Record<string, any> = { role: this.role };

    if (this.role === 'performer') {
      if (!this.stageName) {
        this.error = 'Umetničko ime je obavezno.';
        this.loading = false;
        return;
      }
      metadata['stage_name'] = this.stageName;
      metadata['type'] = this.performerType || 'singer';
    }

    // Use Supabase auth directly; Next.js admin API is for admin-only user creation
    const { error } = await this.supabase.signUp(this.email, this.password, metadata);

    if (error) {
      this.error = error.message;
      this.loading = false;
      return;
    }

    this.router.navigate(['/prijava']);
  }
}
```

`frontend/src/app/pages/register/register.component.html`:
```html
<section class="section">
  <div class="wrap">
    <div class="auth-form">
      <h2>Registracija</h2>
      <p class="muted">Napravi nalog i pronađi savršenu muziku.</p>

      <div class="role-switch">
        <button
          class="role-btn"
          [class.active]="role === 'client'"
          (click)="role = 'client'"
        >
          Klijent
        </button>
        <button
          class="role-btn"
          [class.active]="role === 'performer'"
          (click)="role = 'performer'"
        >
          Izvođač
        </button>
      </div>

      <div class="form-group">
        <label>Email</label>
        <input type="email" [(ngModel)]="email" class="form-input" placeholder="vas@email.com">
      </div>

      <div class="form-group">
        <label>Lozinka</label>
        <input type="password" [(ngModel)]="password" class="form-input" placeholder="Minimalno 6 karaktera">
      </div>

      <ng-container *ngIf="role === 'performer'">
        <div class="form-group">
          <label>Umetničko ime / Naziv benda</label>
          <input type="text" [(ngModel)]="stageName" class="form-input" placeholder="Npr. Tropico Bend">
        </div>

        <div class="form-group">
          <label>Tip izvođača</label>
          <select [(ngModel)]="performerType" class="form-input">
            <option value="singer">Pevač</option>
            <option value="band">Bend</option>
            <option value="dj">DJ</option>
          </select>
        </div>
      </ng-container>

      <p class="error-text" *ngIf="error">{{ error }}</p>

      <button class="btn btn-gold auth-btn" (click)="register()" [disabled]="loading">
        {{ loading ? 'Registracija...' : 'Registruj se' }}
      </button>

      <p class="auth-link">
        Već imaš nalog? <a routerLink="/prijava">Prijavi se</a>
      </p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add auth form styles**

Add to `frontend/src/styles.css`:
```css
.auth-form {
  max-width: 420px;
  margin: 0 auto;
}

.auth-form h2 { font-size: 24px; margin-bottom: 4px; }

.role-switch {
  display: flex;
  background: var(--card);
  border-radius: 8px;
  padding: 4px;
  margin: 24px 0;
}

.role-btn {
  flex: 1;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  transition: all .15s ease;
}

.role-btn.active {
  background: var(--gold);
  color: #1b1409;
}

.auth-btn {
  width: 100%;
  margin-top: 8px;
}

.auth-divider {
  text-align: center;
  color: var(--text-muted);
  margin: 20px 0;
  position: relative;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 20px);
  height: 1px;
  background: var(--card-border);
}

.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }

.google-btn {
  background: var(--card);
  border: 1px solid var(--card-border);
  color: var(--text);
}

.google-btn:hover { border-color: var(--gold); }

.auth-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-muted);
}

.auth-link a { color: var(--gold); font-weight: 600; }
```

- [ ] **Step 4: Verify build**

```bash
cd frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/login/ frontend/src/app/pages/register/ frontend/src/styles.css
git commit -m "feat: implement login and registration pages with role selection"
```

---

### Phase 2 Completion Check

- [ ] Header component with navigation, auth state, and logo
- [ ] Footer component
- [ ] Home page with hero, search panel, featured performers, steps, CTA
- [ ] Performer list page with filters (city, type, event type, price, sort), pagination
- [ ] Performer profile page with tabs (About, Gallery, Video, Reviews)
- [ ] Inquiry form page with performer preview card
- [ ] Login page (email/password + Google OAuth)
- [ ] Registration page with role selection (client/performer)
- [ ] All styles from the example implemented
- [ ] Frontend builds without errors
- [ ] Backend API routes all defined
