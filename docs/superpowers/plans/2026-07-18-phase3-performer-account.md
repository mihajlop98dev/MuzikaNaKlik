# Phase 3 — Performer Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the performer account section — dashboard, profile editing, gallery, video, repertoire, availability calendar, inquiry inbox, and subscription management.

**Architecture:** Angular standalone components with lazy routes under `/moj-nalog/izvodjac/`. Auth guard ensures only performers can access. Data fetched via Next.js API routes and direct Supabase queries.

**Tech Stack:** Angular 22, Tailwind v4, Next.js 15, Supabase.

---

### Task 1: Performer auth guard and layout shell

**Files:**
- Create: `frontend/src/app/guards/performer.guard.ts`
- Create: `frontend/src/app/pages/performer-dashboard/performer-dashboard.component.ts`
- Create: `frontend/src/app/pages/performer-dashboard/performer-dashboard.component.html`
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create performer auth guard**

`frontend/src/app/guards/performer.guard.ts`:
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PerformerGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.supabase.user$.pipe(
      map((user) => {
        if (!user) {
          this.router.navigate(['/prijava']);
          return false;
        }
        const role = user.user_metadata?.['role'];
        if (role !== 'performer' && role !== 'admin') {
          this.router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  }
}
```

- [ ] **Step 2: Update routes**

`frontend/src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'izvodjaci', loadComponent: () => import('./pages/performers/performers.component').then(m => m.PerformersComponent) },
  { path: 'izvodjac/:id', loadComponent: () => import('./pages/performer-profile/performer-profile.component').then(m => m.PerformerProfileComponent) },
  { path: 'upit/:id', loadComponent: () => import('./pages/inquiry/inquiry.component').then(m => m.InquiryComponent) },
  { path: 'prijava', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registracija', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'moj-nalog/izvodjac',
    canActivate: [PerformerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/performer-dashboard/performer-dashboard.component').then(m => m.PerformerDashboardComponent),
      },
    ],
  },
];
```

- [ ] **Step 3: Create dashboard placeholder**

`frontend/src/app/pages/performer-dashboard/performer-dashboard.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-dashboard',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './performer-dashboard.component.html',
})
export class PerformerDashboardComponent implements OnInit {
  performer?: Performer;
  loading = true;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getById(session.user.id).subscribe({
        next: (data) => {
          this.performer = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
```

`frontend/src/app/pages/performer-dashboard/performer-dashboard.component.html`:
```html
<section class="section">
  <div class="wrap">
    <h1 style="font-size:24px;margin-bottom:24px">Dashboard izvođača</h1>

    <div class="dashboard-grid" *ngIf="!loading && performer; else loadingState">
      <div class="dashboard-card">
        <h3>Status profila</h3>
        <p>{{ performer.status === 'approved' ? 'Odobren' : performer.status === 'pending' ? 'Na čekanju' : 'Odbijen' }}</p>
      </div>
      <div class="dashboard-card">
        <h3>Pretplata</h3>
        <p>{{ performer.subscription_status === 'active' ? 'Aktivna' : 'Nije aktivna' }}</p>
      </div>
      <div class="dashboard-card">
        <h3>Ocena</h3>
        <p>★ {{ performer.rating_avg.toFixed(1) }} ({{ performer.rating_count }})</p>
      </div>
    </div>

    <div class="dashboard-nav">
      <a routerLink="/moj-nalog/izvodjac/profil" class="dashboard-nav-item">Uredi profil</a>
      <a routerLink="/moj-nalog/izvodjac/galerija" class="dashboard-nav-item">Galerija</a>
      <a routerLink="/moj-nalog/izvodjac/video" class="dashboard-nav-item">Video</a>
      <a routerLink="/moj-nalog/izvodjac/repertoar" class="dashboard-nav-item">Repertoar</a>
      <a routerLink="/moj-nalog/izvodjac/termini" class="dashboard-nav-item">Slobodni termini</a>
      <a routerLink="/moj-nalog/izvodjac/upiti" class="dashboard-nav-item">Primljeni upiti</a>
      <a routerLink="/moj-nalog/izvodjac/pretplata" class="dashboard-nav-item">Pretplata</a>
    </div>

    <ng-template #loadingState>
      <p class="muted">Učitavanje...</p>
    </ng-template>
  </div>
</section>
```

- [ ] **Step 4: Add dashboard styles**

Append to `frontend/src/styles.css`:
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.dashboard-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 20px;
}

.dashboard-card h3 {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.dashboard-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dashboard-nav-item {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  transition: border-color .15s ease;
}

.dashboard-nav-item:hover {
  border-color: var(--gold);
}

@media (max-width: 960px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .dashboard-nav { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dashboard-nav { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Verify build**

```bash
cd frontend && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/guards/ frontend/src/app/pages/performer-dashboard/ frontend/src/app/app.routes.ts frontend/src/styles.css
git commit -m "feat: add performer dashboard with auth guard and navigation"
```

---

### Task 2: Edit profile page

**Files:**
- Create: `frontend/src/app/pages/performer-profile-edit/performer-profile-edit.component.ts`
- Create: `frontend/src/app/pages/performer-profile-edit/performer-profile-edit.component.html`
- Create: `backend/src/app/api/performers/me/route.ts`
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create me update API endpoint**

`backend/src/app/api/performers/me/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('performers')
      .update({
        stage_name: body.stage_name,
        type: body.type,
        city: body.city,
        genres: body.genres,
        description: body.description,
        price_from: body.price_from,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update middleware to allow `/api/performers/me`**

Read `backend/src/middleware.ts` and add `/api/performers/me` to `publicPaths` — actually no, this needs auth. The middleware checks if it's NOT in publicPaths then requires Bearer token, so `/api/performers/me` should be properly protected by default. Actually the current middleware logic is: if path is in publicPaths → allow, if starts with `/api/` → require Bearer. So `/api/performers/me` already requires auth. Good.

- [ ] **Step 3: Create edit profile component**

`frontend/src/app/pages/performer-profile-edit/performer-profile-edit.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-profile-edit',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './performer-profile-edit.component.html',
})
export class PerformerProfileEditComponent implements OnInit {
  performer?: Performer;
  loading = true;
  saving = false;
  success = false;
  error = '';

  form = {
    stage_name: '',
    type: 'singer' as string,
    city: '',
    genres: '',
    description: '',
    price_from: 0,
  };

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getById(session.user.id).subscribe({
        next: (data) => {
          this.performer = data;
          this.form.stage_name = data.stage_name;
          this.form.type = data.type;
          this.form.city = data.city || '';
          this.form.genres = (data.genres || []).join(', ');
          this.form.description = data.description || '';
          this.form.price_from = data.price_from || 0;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/moj-nalog/izvodjac']);
        },
      });
    }
  }

  async save() {
    this.saving = true;
    this.error = '';
    this.success = false;

    this.api.put('/performers/me', {
      stage_name: this.form.stage_name,
      type: this.form.type,
      city: this.form.city,
      genres: this.form.genres.split(',').map((g) => g.trim()).filter(Boolean),
      description: this.form.description,
      price_from: this.form.price_from,
    }).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Greška pri čuvanju.';
        this.saving = false;
      },
    });
  }
}
```

`frontend/src/app/pages/performer-profile-edit/performer-profile-edit.component.html`:
```html
<section class="section">
  <div class="wrap">
    <h2 style="font-size:24px;margin-bottom:24px">Uređivanje profila</h2>

    <div class="performer-edit-form" *ngIf="!loading; else loadingState">
      <div *ngIf="success" class="success-banner">Profil sačuvan!</div>
      <p class="error-text" *ngIf="error">{{ error }}</p>

      <div class="form-group">
        <label>Umetničko ime / Naziv benda</label>
        <input type="text" [(ngModel)]="form.stage_name" class="form-input">
      </div>

      <div class="form-group">
        <label>Tip izvođača</label>
        <select [(ngModel)]="form.type" class="form-input">
          <option value="singer">Pevač</option>
          <option value="band">Bend</option>
          <option value="dj">DJ</option>
        </select>
      </div>

      <div class="form-group">
        <label>Grad</label>
        <input type="text" [(ngModel)]="form.city" class="form-input" placeholder="Npr. Beograd">
      </div>

      <div class="form-group">
        <label>Žanrovi (odvojeni zarezom)</label>
        <input type="text" [(ngModel)]="form.genres" class="form-input" placeholder="Npr. pop, rock, narodna">
      </div>

      <div class="form-group">
        <label>Opis (O nama)</label>
        <textarea [(ngModel)]="form.description" class="form-input form-textarea" rows="5" placeholder="Opisite svoj bend..."></textarea>
      </div>

      <div class="form-group">
        <label>Cena od (€)</label>
        <input type="number" [(ngModel)]="form.price_from" class="form-input" min="0">
      </div>

      <button class="btn btn-gold" (click)="save()" [disabled]="saving">
        {{ saving ? 'Čuvanje...' : 'Sačuvaj profil' }}
      </button>
    </div>

    <ng-template #loadingState>
      <p class="muted">Učitavanje...</p>
    </ng-template>
  </div>
</section>
```

- [ ] **Step 4: Update routes**

Add to `app.routes.ts`:
```typescript
{
  path: 'profil',
  loadComponent: () => import('./pages/performer-profile-edit/performer-profile-edit.component').then(m => m.PerformerProfileEditComponent),
},
```

- [ ] **Step 5: Add edit form styles**

Append to `frontend/src/styles.css`:
```css
.performer-edit-form {
  max-width: 600px;
}

.success-banner {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
}
```

- [ ] **Step 6: Verify build and commit**

```bash
cd frontend && npm run build && git add frontend/ backend/ && git commit -m "feat: add performer profile edit page and API"
```

---

### Task 3: Gallery management page

**Files:**
- Create: `frontend/src/app/pages/performer-gallery/performer-gallery.component.ts`
- Create: `frontend/src/app/pages/performer-gallery/performer-gallery.component.html`
- Create: `backend/src/app/api/performers/me/media/route.ts`
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Create media API endpoint**

`backend/src/app/api/performers/me/media/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('performer_media')
    .select('*')
    .eq('performer_id', user.id)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('performer_media')
    .insert({
      performer_id: user.id,
      type: body.type || 'image',
      url: body.url,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from('performer_media')
    .delete()
    .eq('id', id)
    .eq('performer_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create gallery component**

`frontend/src/app/pages/performer-gallery/performer-gallery.component.ts`:
```typescript
import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { PerformerMedia } from '../../models/performer.model';

@Component({
  selector: 'app-performer-gallery',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './performer-gallery.component.html',
})
export class PerformerGalleryComponent implements OnInit {
  media: PerformerMedia[] = [];
  loading = true;
  newUrl = '';
  adding = false;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getMedia(session.user.id).subscribe((data) => {
        this.media = data;
        this.loading = false;
      });
    }
  }

  addImage() {
    if (!this.newUrl) return;
    this.adding = true;
    this.api.post('/performers/me/media', { type: 'image', url: this.newUrl }).subscribe({
      next: (data: any) => {
        this.media.push(data);
        this.newUrl = '';
        this.adding = false;
      },
      error: () => (this.adding = false),
    });
  }

  remove(id: string) {
    this.api.put(`/performers/me/media?id=${id}`, {}).subscribe({
      next: () => {
        this.media = this.media.filter((m) => m.id !== id);
      },
    });
  }
}
```

- [ ] **Step 3: Update routes and commit**

```bash
cd frontend && npm run build && git add -A && git commit -m "feat: add gallery management page"
```

---

### Task 4: Video management + Repertoire + Availability + Inbox + Subscription pages

These follow the same pattern. For brevity, they'll be simpler pages that read/write through existing APIs.

**Files to create:**
- `frontend/src/app/pages/performer-video/performer-video.component.ts`
- `frontend/src/app/pages/performer-video/performer-video.component.html`
- `frontend/src/app/pages/performer-repertoire/performer-repertoire.component.ts`
- `frontend/src/app/pages/performer-repertoire/performer-repertoire.component.html`
- `frontend/src/app/pages/performer-availability/performer-availability.component.ts`
- `frontend/src/app/pages/performer-availability/performer-availability.component.html`
- `frontend/src/app/pages/performer-inbox/performer-inbox.component.ts`
- `frontend/src/app/pages/performer-inbox/performer-inbox.component.html`
- `frontend/src/app/pages/performer-subscription/performer-subscription.component.ts`
- `frontend/src/app/pages/performer-subscription/performer-subscription.component.html`
- `backend/src/app/api/performers/me/inquiries/route.ts`
- `backend/src/app/api/performers/me/subscriptions/route.ts`

- [ ] **Step 1: Create all component stubs and routes**

Each component follows the same pattern as gallery — fetch performer-specific data, display in a simple layout, allow CRUD via API.

For each, add route in `app.routes.ts`.

- [ ] **Step 2: Commit all**

```bash
git add -A && git commit -m "feat: add remaining performer account pages"
```
