# Admin Panel Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace basic admin dashboard with a full admin panel with sidebar layout, user/subscription/review management, reports, activity log, and plan settings.

**Architecture:** New `AdminLayoutComponent` wraps all admin routes with sidebar. Backend endpoints return aggregated data for reports. Chart.js for visualizations. `activity_logs` table for audit trail.

**Tech Stack:** Angular 22, Next.js API routes, Supabase, Chart.js + ng2-charts

---

### Task 1: Install frontend dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install chart.js and ng2-charts**

```bash
cd "/Volumes/Extreme Pro/Projects/MuzikaNaKlik/frontend"
npm install chart.js ng2-charts
```

- [ ] **Step 2: Verify installation**

Check that `package.json` now includes `chart.js` and `ng2-charts`.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add chart.js and ng2-charts dependencies"
```

---

### Task 2: Create activity_logs table in Supabase

**Files:**
- Create: `supabase/migrations/006_activity_logs.sql`

- [ ] **Step 1: Create migration file**

```sql
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs
CREATE POLICY "Admins can read activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

- [ ] **Step 2: Run migration**

```bash
cd "/Volumes/Extreme Pro/Projects/MuzikaNaKlik"
npx supabase migration up
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_activity_logs.sql
git commit -m "feat: add activity_logs table"
```

---

### Task 3: Create Admin Layout component

**Files:**
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.ts`
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.html`
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.scss`

- [ ] **Step 1: Create the SCSS file**

```scss
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f6fa;
}

.admin-sidebar {
  width: 240px;
  background: #1a1a2e;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;

  .sidebar-logo {
    padding: 24px 20px;
    font-size: 16px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    a { color: #fff; text-decoration: none; }
    small { font-weight: 400; opacity: 0.6; font-size: 12px; }
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 0;
    a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
      &:hover, &.active { background: rgba(255,255,255,0.08); color: #fff; }
    }
  }

  .sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    button {
      width: 100%;
      padding: 10px;
      background: rgba(255,255,255,0.1);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      &:hover { background: rgba(255,255,255,0.2); }
    }
  }

  .hamburger {
    display: none;
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 16px 20px;
  }
}

.admin-content {
  margin-left: 240px;
  flex: 1;
  padding: 32px;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 100%;
    height: auto;
    position: relative;
    flex-direction: row;
    flex-wrap: wrap;
    .sidebar-logo { flex: 1; }
    .hamburger { display: block; }
    .sidebar-nav, .sidebar-footer { display: none; width: 100%; }
    &.open .sidebar-nav, &.open .sidebar-footer { display: block; }
  }
  .admin-content { margin-left: 0; }
}
```

- [ ] **Step 2: Create the component TS file**

```typescript
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, AsyncPipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, AsyncPipe],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  sidebarOpen = false;

  constructor(private supabase: SupabaseService) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  signOut() {
    this.supabase.signOut();
  }

  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/korisnici', label: 'Korisnici', icon: '👥' },
    { path: '/admin/pretplate', label: 'Pretplate', icon: '💳' },
    { path: '/admin/recenzije', label: 'Recenzije', icon: '⭐' },
    { path: '/admin/izvestaji', label: 'Izveštaji', icon: '📈' },
    { path: '/admin/aktivnosti', label: 'Aktivnosti', icon: '📋' },
    { path: '/admin/podesavanja', label: 'Podešavanja', icon: '⚙️' },
  ];
}
```

- [ ] **Step 3: Create the template file**

```html
<div class="admin-layout">
  <aside class="admin-sidebar" [class.open]="sidebarOpen">
    <div class="sidebar-logo">
      <a routerLink="/admin/dashboard">
        Muzika Na Klik<br>
        <small>Admin panel</small>
      </a>
      <button class="hamburger" (click)="toggleSidebar()">☰</button>
    </div>
    <nav class="sidebar-nav">
      <a *ngFor="let item of navItems"
        [routerLink]="item.path"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{exact: item.path === '/admin/dashboard'}">
        <span>{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </a>
    </nav>
    <div class="sidebar-footer">
      <button (click)="signOut()">Izloguj se</button>
    </div>
  </aside>
  <main class="admin-content">
    <router-outlet></router-outlet>
  </main>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/layouts/admin-layout/
git commit -m "feat: add admin layout component with sidebar"
```

---

### Task 4: Update routes for admin layout

**Files:**
- Modify: `frontend/src/app/app.routes.ts:46-94`

- [ ] **Step 1: Replace admin routes to use AdminLayoutComponent as parent**

Replace lines 46-94:

```typescript
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'izvodjaci',
        loadComponent: () =>
          import('./pages/admin-performers/admin-performers.component').then(
            (m) => m.AdminPerformersComponent
          ),
      },
      {
        path: 'korisnici',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'pretplate',
        loadComponent: () =>
          import('./pages/admin-subscriptions/admin-subscriptions.component').then(
            (m) => m.AdminSubscriptionsComponent
          ),
      },
      {
        path: 'recenzije',
        loadComponent: () =>
          import('./pages/admin-reviews/admin-reviews.component').then(
            (m) => m.AdminReviewsComponent
          ),
      },
      {
        path: 'izvestaji',
        loadComponent: () =>
          import('./pages/admin-stats/admin-stats.component').then(
            (m) => m.AdminStatsComponent
          ),
      },
    ],
  },
```

Note: We'll add activity and settings routes in later tasks after creating their components.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/app.routes.ts
git commit -m "feat: wrap admin routes with AdminLayoutComponent"
```

---

### Task 5: Update Admin Dashboard

**Files:**
- Modify: `frontend/src/app/pages/admin-dashboard/admin-dashboard.component.ts`
- Modify: `frontend/src/app/pages/admin-dashboard/admin-dashboard.component.html`

- [ ] **Step 1: Rewrite the dashboard template**

Replace the entire `admin-dashboard.component.html`:

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Dashboard</h1>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-bottom:32px">
    <div class="dashboard-card" *ngIf="!loading">
      <h3 style="font-size:13px;color:#888;margin:0 0 8px">Izvođači</h3>
      <p style="font-size:32px;font-weight:700;margin:0">{{ stats.total_performers }}</p>
    </div>
    <div class="dashboard-card" *ngIf="!loading">
      <h3 style="font-size:13px;color:#888;margin:0 0 8px">Klijenti</h3>
      <p style="font-size:32px;font-weight:700;margin:0">{{ stats.total_clients }}</p>
    </div>
    <div class="dashboard-card" *ngIf="!loading">
      <h3 style="font-size:13px;color:#888;margin:0 0 8px">Na čekanju</h3>
      <p style="font-size:32px;font-weight:700;margin:0">{{ stats.pending_performers }}</p>
    </div>
    <div class="dashboard-card" *ngIf="!loading">
      <h3 style="font-size:13px;color:#888;margin:0 0 8px">Upiti (mesec)</h3>
      <p style="font-size:32px;font-weight:700;margin:0">{{ stats.total_inquiries }}</p>
    </div>
    <div class="dashboard-card" *ngIf="!loading">
      <h3 style="font-size:13px;color:#888;margin:0 0 8px">Aktivne pretplate</h3>
      <p style="font-size:32px;font-weight:700;margin:0">{{ stats.active_subscriptions }}</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
    <a routerLink="/admin/korisnici" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">👥 Korisnici</h3>
      <p style="margin:0;color:#888;font-size:13px">Pregled i upravljanje korisnicima</p>
    </a>
    <a routerLink="/admin/pretplate" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">💳 Pretplate</h3>
      <p style="margin:0;color:#888;font-size:13px">Upravljanje pretplatama izvođača</p>
    </a>
    <a routerLink="/admin/recenzije" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">⭐ Recenzije</h3>
      <p style="margin:0;color:#888;font-size:13px">Moderacija recenzija</p>
    </a>
    <a routerLink="/admin/izvestaji" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">📈 Izveštaji</h3>
      <p style="margin:0;color:#888;font-size:13px">Grafikoni i statistika</p>
    </a>
    <a routerLink="/admin/aktivnosti" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">📋 Aktivnosti</h3>
      <p style="margin:0;color:#888;font-size:13px">Dnevnik aktivnosti</p>
    </a>
    <a routerLink="/admin/podesavanja" class="dashboard-card" style="display:block;text-decoration:none;color:inherit">
      <h3 style="font-size:16px;margin:0 0 4px">⚙️ Podešavanja</h3>
      <p style="margin:0;color:#888;font-size:13px">Podešavanje planova</p>
    </a>
  </div>
</div>
```

- [ ] **Step 2: Update component to match the new route path**

The component requires no logic changes — it already fetches from `/admin/stats` and the template uses `stats` and `loading`. The `routerLink` paths in the template already point to the new routes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/pages/admin-dashboard/
git commit -m "feat: redesign admin dashboard with quick links"
```

---

### Task 6: Add sidebar CSS to global styles

**Files:**
- Modify: `frontend/src/styles.scss` (or equivalent global styles file)

- [ ] **Step 1: Add dashboard-card styles**

Find the global styles file and add:
```scss
.dashboard-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/styles.scss
git commit -m "style: add dashboard-card global styles"
```

---

### Task 7: Create GET /api/admin/users endpoint

**Files:**
- Create: `backend/src/app/api/admin/users/route.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false });

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with performer data if role is performer
  const performerIds = profiles?.filter(p => p.role === 'performer').map(p => p.id) || [];
  let performersMap: Record<string, any> = {};

  if (performerIds.length > 0) {
    const { data: performers } = await supabaseAdmin
      .from('performers')
      .select('id, stage_name, status, subscription_status')
      .in('id', performerIds);

    if (performers) {
      performers.forEach(p => { performersMap[p.id] = p; });
    }
  }

  const result = profiles?.map(p => ({
    ...p,
    stage_name: performersMap[p.id]?.stage_name || null,
    performer_status: performersMap[p.id]?.status || null,
    subscription_status: performersMap[p.id]?.subscription_status || null,
  })) || [];

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -s "http://localhost:3000/api/admin/users" -H "Authorization: Bearer YOUR_ADMIN_TOKEN"`
Expected: JSON array of users

- [ ] **Step 3: Commit**

```bash
git add backend/src/app/api/admin/users/route.ts
git commit -m "feat: add GET /api/admin/users endpoint with search and filter"
```

---

### Task 8: Rewrite Admin Users page

**Files:**
- Modify: `frontend/src/app/pages/admin-users/admin-users.component.ts`
- Modify: `frontend/src/app/pages/admin-users/admin-users.component.html`

- [ ] **Step 1: Rewrite the component**

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  loading = true;
  searchTerm = '';
  roleFilter = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    const params = new URLSearchParams();
    if (this.searchTerm) params.set('search', this.searchTerm);
    if (this.roleFilter) params.set('role', this.roleFilter);

    this.api.get<any[]>(`/admin/users?${params.toString()}`).subscribe({
      next: (data) => { this.users = data; this.filtered = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  search() {
    this.fetchUsers();
  }

  setRole(role: string) {
    this.roleFilter = role;
    this.fetchUsers();
  }
}
```

- [ ] **Step 2: Rewrite the template**

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Korisnici</h1>

  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
    <input type="text" [(ngModel)]="searchTerm" (keyup.enter)="search()"
      placeholder="Pretraži po imenu ili emailu..."
      style="flex:1;min-width:200px;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px">
    <button class="btn" (click)="search()" style="background:#1a1a2e;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer">Pretraži</button>
  </div>

  <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
    <button (click)="setRole('')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="roleFilter === '' ? '#1a1a2e' : '#fff'" [style.color]="roleFilter === '' ? '#fff' : '#333'">Svi</button>
    <button (click)="setRole('performer')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="roleFilter === 'performer' ? '#1a1a2e' : '#fff'" [style.color]="roleFilter === 'performer' ? '#fff' : '#333'">Izvođači</button>
    <button (click)="setRole('client')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="roleFilter === 'client' ? '#1a1a2e' : '#fff'" [style.color]="roleFilter === 'client' ? '#fff' : '#333'">Klijenti</button>
    <button (click)="setRole('admin')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="roleFilter === 'admin' ? '#1a1a2e' : '#fff'" [style.color]="roleFilter === 'admin' ? '#fff' : '#333'">Admini</button>
  </div>

  <div *ngIf="loading" class="muted">Učitavanje...</div>

  <div *ngIf="!loading && filtered.length === 0" class="muted">Nema korisnika.</div>

  <table *ngIf="!loading && filtered.length > 0" style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <thead>
      <tr style="background:#f8f9fa;text-align:left">
        <th style="padding:12px 16px;font-size:13px;color:#888">Ime</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Email</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Uloga</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Status</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Datum</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let u of filtered" style="border-top:1px solid #f0f0f0">
        <td style="padding:12px 16px;font-weight:500">{{ u.stage_name || u.full_name || '-' }}</td>
        <td style="padding:12px 16px;color:#555">{{ u.email }}</td>
        <td style="padding:12px 16px">
          <span style="padding:2px 10px;border-radius:12px;font-size:12px;background:#e8f4fd;color:#1976d2">{{ u.role }}</span>
        </td>
        <td style="padding:12px 16px">
          <span *ngIf="u.performer_status" style="padding:2px 10px;border-radius:12px;font-size:12px"
            [style.background]="u.performer_status === 'approved' ? '#e8f5e9' : '#fff3e0'"
            [style.color]="u.performer_status === 'approved' ? '#2e7d32' : '#e65100'">
            {{ u.performer_status }}
          </span>
          <span *ngIf="!u.performer_status" class="muted">—</span>
        </td>
        <td style="padding:12px 16px;color:#888;font-size:13px">{{ u.created_at | date:'dd.MM.yyyy' }}</td>
      </tr>
    </tbody>
  </table>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/pages/admin-users/
git commit -m "feat: redesign admin users page with search and filtering"
```

---

### Task 9: Rewrite Admin Subscriptions page

**Files:**
- Modify: `frontend/src/app/pages/admin-subscriptions/admin-subscriptions.component.ts`
- Modify: `frontend/src/app/pages/admin-subscriptions/admin-subscriptions.component.html`
- Modify: `backend/src/app/api/admin/subscriptions/route.ts` — add GET query params

- [ ] **Step 1: Read current backend subscriptions route**

```bash
cat "/Volumes/Extreme Pro/Projects/MuzikaNaKlik/backend/src/app/api/admin/subscriptions/route.ts"
```

- [ ] **Step 2: Update backend to support status filter**

Add status query param support to the existing GET:

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';

  let query = supabaseAdmin
    .from('subscriptions')
    .select('*, performers(stage_name, id), subscription_plans(name, price)')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}
// ... keep the existing POST handler
```

- [ ] **Step 3: Rewrite frontend component**

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe],
  templateUrl: './admin-subscriptions.component.html',
})
export class AdminSubscriptionsComponent implements OnInit {
  subscriptions: any[] = [];
  loading = true;
  statusFilter = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchSubscriptions();
  }

  fetchSubscriptions() {
    this.loading = true;
    const params = this.statusFilter ? `?status=${this.statusFilter}` : '';
    this.api.get<any[]>(`/admin/subscriptions${params}`).subscribe({
      next: (data) => { this.subscriptions = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  setFilter(status: string) {
    this.statusFilter = status;
    this.fetchSubscriptions();
  }

  getStatusLabel(status: string): string {
    return { active: 'Aktivna', expired: 'Istekla', cancelled: 'Otkazana' }[status] || status;
  }

  getStatusColor(status: string): string {
    return { active: '#2e7d32', expired: '#e65100', cancelled: '#888' }[status] || '#888';
  }
}
```

- [ ] **Step 4: Rewrite template**

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Pretplate</h1>

  <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
    <button (click)="setFilter('')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="statusFilter === '' ? '#1a1a2e' : '#fff'" [style.color]="statusFilter === '' ? '#fff' : '#333'">Sve</button>
    <button (click)="setFilter('active')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="statusFilter === 'active' ? '#1a1a2e' : '#fff'" [style.color]="statusFilter === 'active' ? '#fff' : '#333'">Aktivne</button>
    <button (click)="setFilter('expired')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="statusFilter === 'expired' ? '#1a1a2e' : '#fff'" [style.color]="statusFilter === 'expired' ? '#fff' : '#333'">Istekle</button>
    <button (click)="setFilter('cancelled')" style="padding:6px 14px;border-radius:20px;border:1px solid #ddd;cursor:pointer;font-size:13px;background:#fff"
      [style.background]="statusFilter === 'cancelled' ? '#1a1a2e' : '#fff'" [style.color]="statusFilter === 'cancelled' ? '#fff' : '#333'">Otkazane</button>
  </div>

  <div *ngIf="loading" class="muted">Učitavanje...</div>
  <div *ngIf="!loading && subscriptions.length === 0" class="muted">Nema pretplati.</div>

  <table *ngIf="!loading && subscriptions.length > 0" style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <thead>
      <tr style="background:#f8f9fa;text-align:left">
        <th style="padding:12px 16px;font-size:13px;color:#888">Izvođač</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Plan</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Iznos</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Period</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Status</th>
        <th style="padding:12px 16px;font-size:13px;color:#888">Način</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let s of subscriptions" style="border-top:1px solid #f0f0f0">
        <td style="padding:12px 16px;font-weight:500">{{ s.performers?.stage_name || '-' }}</td>
        <td style="padding:12px 16px">{{ s.subscription_plans?.name || '-' }}</td>
        <td style="padding:12px 16px">{{ (s.amount / 100) | number:'1.2-2' }}€</td>
        <td style="padding:12px 16px;font-size:13px;color:#555">{{ s.period_start }} — {{ s.period_end }}</td>
        <td style="padding:12px 16px">
          <span style="padding:2px 10px;border-radius:12px;font-size:12px;font-weight:500"
            [style.background]="s.status === 'active' ? '#e8f5e9' : s.status === 'expired' ? '#fff3e0' : '#f5f5f5'"
            [style.color]="s.status === 'active' ? '#2e7d32' : s.status === 'expired' ? '#e65100' : '#888'">
            {{ getStatusLabel(s.status) }}
          </span>
        </td>
        <td style="padding:12px 16px;font-size:13px;color:#555">{{ s.payment_method === 'manual' ? 'Ručno' : 'Stripe' }}</td>
      </tr>
    </tbody>
  </table>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/api/admin/subscriptions/route.ts frontend/src/app/pages/admin-subscriptions/
git commit -m "feat: redesign admin subscriptions page with filtering"
```

---

### Task 10: Rewrite Admin Reviews page

**Files:**
- Modify: `frontend/src/app/pages/admin-reviews/admin-reviews.component.ts`
- Modify: `frontend/src/app/pages/admin-reviews/admin-reviews.component.html`

- [ ] **Step 1: Update component with proper interfaces**

The existing backend `GET /admin/reviews` likely returns reviews with performer info. Update the component to show a proper table.

Read components first: `cat frontend/src/app/pages/admin-reviews/admin-reviews.component.ts`

Then rewrite with proper template showing: performer, user, rating, comment (truncated), status, date, actions.

The existing logic already handles toggleVisibility. Just improve the display.

- [ ] **Step 2: Implement the template and commit**

```bash
git add frontend/src/app/pages/admin-reviews/
git commit -m "feat: redesign admin reviews page"
```

---

### Task 11: Create Reports (Charts) page

**Files:**
- Modify: `frontend/src/app/pages/admin-stats/admin-stats.component.ts` — becomes reports page
- Modify: `frontend/src/app/pages/admin-stats/admin-stats.component.html`
- Create: `backend/src/app/api/admin/reports/registrations/route.ts`
- Create: `backend/src/app/api/admin/reports/subscriptions/route.ts`

- [ ] **Step 1: Create backend registrations report endpoint**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get registrations grouped by month for the last 12 months
  const { data: performers } = await supabaseAdmin
    .from('performers')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at');

  const { data: clients } = await supabaseAdmin
    .from('profiles')
    .select('created_at')
    .eq('role', 'client')
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at');

  // Aggregate by month
  const months: Record<string, { performers: number; clients: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = { performers: 0, clients: 0 };
  }

  performers?.forEach(p => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) months[key].performers++;
  });

  clients?.forEach(c => {
    const d = new Date(c.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (months[key]) months[key].clients++;
  });

  const labels = Object.keys(months).reverse();
  const data = labels.map(k => months[k]);

  return NextResponse.json({ labels, data });
}
```

- [ ] **Step 2: Create backend subscriptions report endpoint**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Subscription plan distribution
  const { data: planDist } = await supabaseAdmin
    .from('subscriptions')
    .select('subscription_plans(name)')
    .eq('status', 'active');

  const planCounts: Record<string, number> = {};
  planDist?.forEach(s => {
    const name = s.subscription_plans?.name || 'Unknown';
    planCounts[name] = (planCounts[name] || 0) + 1;
  });

  // Performer status distribution
  const { data: statusDist } = await supabaseAdmin
    .from('performers')
    .select('status');

  const statusCounts: Record<string, number> = {};
  statusDist?.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  return NextResponse.json({
    planDistribution: Object.entries(planCounts).map(([name, count]) => ({ name, count })),
    statusDistribution: Object.entries(statusCounts).map(([name, count]) => ({ name, count })),
  });
}
```

- [ ] **Step 3: Update admin-stats component for reports**

Rewrite `admin-stats.component.ts`:

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [NgIf, BaseChartDirective],
  templateUrl: './admin-stats.component.html',
})
export class AdminStatsComponent implements OnInit {
  loading = true;

  registrationsData: ChartConfiguration['data'] | null = null;
  registrationsOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: true } },
  };

  planLabels: string[] = [];
  planData: number[] = [];
  planChartType: ChartType = 'pie';

  statusLabels: string[] = [];
  statusData: number[] = [];
  statusChartType: ChartType = 'pie';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any>('/admin/reports/registrations').subscribe({
      next: (r) => {
        this.registrationsData = {
          labels: r.labels,
          datasets: [
            { data: r.data.map((d: any) => d.performers), label: 'Izvođači', backgroundColor: '#42a5f5' },
            { data: r.data.map((d: any) => d.clients), label: 'Klijenti', backgroundColor: '#66bb6a' },
          ],
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });

    this.api.get<any>('/admin/reports/subscriptions').subscribe({
      next: (r) => {
        this.planLabels = r.planDistribution.map((p: any) => p.name);
        this.planData = r.planDistribution.map((p: any) => p.count);
        this.statusLabels = r.statusDistribution.map((s: any) => s.name);
        this.statusData = r.statusDistribution.map((s: any) => s.count);
        this.cdr.detectChanges();
      },
    });
  }
}
```

- [ ] **Step 4: Create reports template**

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Izveštaji</h1>

  <div *ngIf="loading" class="muted">Učitavanje...</div>

  <div *ngIf="!loading" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:24px">
    <div class="dashboard-card">
      <h3 style="margin:0 0 16px">Registracije (12 meseci)</h3>
      <canvas *ngIf="registrationsData" baseChart
        [data]="registrationsData"
        [options]="registrationsOptions"
        type="bar">
      </canvas>
    </div>

    <div class="dashboard-card">
      <h3 style="margin:0 0 16px">Planovi pretplate</h3>
      <canvas baseChart
        [data]="{ labels: planLabels, datasets: [{ data: planData }] }"
        [options]="{ responsive: true, plugins: { legend: { position: 'bottom' } } }"
        type="pie">
      </canvas>
    </div>

    <div class="dashboard-card">
      <h3 style="margin:0 0 16px">Status izvođača</h3>
      <canvas baseChart
        [data]="{ labels: statusLabels, datasets: [{ data: statusData }] }"
        [options]="{ responsive: true, plugins: { legend: { position: 'bottom' } } }"
        type="pie">
      </canvas>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/api/admin/reports/ frontend/src/app/pages/admin-stats/
git commit -m "feat: add reports page with Chart.js charts"
```

---

### Task 12: Create Activity Log page

**Files:**
- Create: `frontend/src/app/pages/admin-activity/admin-activity.component.ts`
- Create: `frontend/src/app/pages/admin-activity/admin-activity.component.html`
- Create: `backend/src/app/api/admin/activity-log/route.ts`
- Modify: `frontend/src/app/app.routes.ts` — add activity route

- [ ] **Step 1: Create backend activity-log endpoint**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`user_email.ilike.%${search}%,action.ilike.%${search}%`);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}
```

- [ ] **Step 2: Create frontend component**

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './admin-activity.component.html',
})
export class AdminActivityComponent implements OnInit {
  activities: any[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchActivities();
  }

  fetchActivities() {
    this.loading = true;
    const params = this.searchTerm ? `?search=${this.searchTerm}` : '';
    this.api.get<any[]>(`/admin/activity-log${params}`).subscribe({
      next: (data) => { this.activities = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }
}
```

- [ ] **Step 3: Create template**

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Aktivnosti</h1>

  <div style="display:flex;gap:12px;margin-bottom:20px">
    <input type="text" [(ngModel)]="searchTerm" (keyup.enter)="fetchActivities()"
      placeholder="Pretraži aktivnosti..."
      style="flex:1;max-width:400px;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px">
    <button class="btn" (click)="fetchActivities()" style="background:#1a1a2e;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer">Pretraži</button>
  </div>

  <div *ngIf="loading" class="muted">Učitavanje...</div>
  <div *ngIf="!loading && activities.length === 0" class="muted">Nema aktivnosti.</div>

  <div *ngIf="!loading && activities.length > 0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
    <div *ngFor="let a of activities" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
      <div>
        <strong style="font-size:14px">{{ a.user_email }}</strong>
        <span style="margin:0 8px;color:#888">—</span>
        <span style="font-size:14px">{{ a.action }}</span>
      </div>
      <div style="font-size:13px;color:#888">{{ a.created_at | date:'dd.MM.yyyy HH:mm' }}</div>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add activity route to app.routes.ts**

Add inside the admin children array:
```typescript
      {
        path: 'aktivnosti',
        loadComponent: () =>
          import('./pages/admin-activity/admin-activity.component').then(
            (m) => m.AdminActivityComponent
          ),
      },
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/app/api/admin/activity-log/route.ts frontend/src/app/pages/admin-activity/ frontend/src/app/app.routes.ts
git commit -m "feat: add activity log page"
```

---

### Task 13: Create Settings (Plans) page

**Files:**
- Create: `frontend/src/app/pages/admin-settings/admin-settings.component.ts`
- Create: `frontend/src/app/pages/admin-settings/admin-settings.component.html`
- Create: `backend/src/app/api/admin/plans/route.ts` — GET all plans
- Create: `backend/src/app/api/admin/plans/[id]/route.ts` — PUT update plan
- Modify: `frontend/src/app/app.routes.ts` — add settings route

- [ ] **Step 1: Create backend GET /api/admin/plans**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data } = await supabaseAdmin.from('subscription_plans').select('*').order('price');
  return NextResponse.json(data || []);
}
```

- [ ] **Step 2: Create backend PUT /api/admin/plans/[id]**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.price !== undefined) updates.price = body.price;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const { data, error } = await supabaseAdmin.from('subscription_plans').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 3: Create frontend component**

```typescript
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './admin-settings.component.html',
})
export class AdminSettingsComponent implements OnInit {
  plans: any[] = [];
  loading = true;
  savingId: string | null = null;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.get<any[]>('/admin/plans').subscribe({
      next: (data) => { this.plans = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  savePlan(plan: any) {
    this.savingId = plan.id;
    this.api.put(`/admin/plans/${plan.id}`, {
      name: plan.name,
      price: plan.price,
      is_active: plan.is_active,
    }).subscribe({
      next: () => { this.savingId = null; this.cdr.detectChanges(); },
      error: () => { this.savingId = null; this.cdr.detectChanges(); },
    });
  }
}
```

- [ ] **Step 4: Create template**

```html
<div>
  <h1 style="font-size:24px;margin-bottom:24px">Podešavanja — Planovi</h1>

  <div *ngIf="loading" class="muted">Učitavanje...</div>

  <div *ngIf="!loading" style="display:grid;gap:16px;max-width:600px">
    <div *ngFor="let plan of plans" class="dashboard-card">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <input type="text" [(ngModel)]="plan.name"
          style="flex:1;min-width:120px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;font-weight:600">

        <div style="display:flex;align-items:center;gap:4px">
          <input type="number" [(ngModel)]="plan.price"
            style="width:100px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px">
          <span style="font-size:14px;color:#888">({{ plan.price / 100 }}€)</span>
        </div>

        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:14px">
          <input type="checkbox" [(ngModel)]="plan.is_active">
          Aktivno
        </label>

        <button (click)="savePlan(plan)"
          style="padding:8px 20px;background:#1a1a2e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px"
          [disabled]="savingId === plan.id">
          {{ savingId === plan.id ? 'Čuvanje...' : 'Sačuvaj' }}
        </button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add settings route to app.routes.ts**

Add inside the admin children array:
```typescript
      {
        path: 'podesavanja',
        loadComponent: () =>
          import('./pages/admin-settings/admin-settings.component').then(
            (m) => m.AdminSettingsComponent
          ),
      },
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/app/api/admin/plans/ frontend/src/app/pages/admin-settings/ frontend/src/app/app.routes.ts
git commit -m "feat: add admin settings page for plan management"
```

---

### Task 14: TypeScript check and verify build

- [ ] **Step 1: Run TypeScript check**

```bash
cd "/Volumes/Extreme Pro/Projects/MuzikaNaKlik/frontend" && npx tsc --noEmit 2>&1
```

Expected: No errors

- [ ] **Step 2: Fix any errors if found**

If errors exist, fix them and re-run until clean.

- [ ] **Step 3: Commit any fixes**

```bash
git commit -m "fix: resolve TypeScript errors"
```
