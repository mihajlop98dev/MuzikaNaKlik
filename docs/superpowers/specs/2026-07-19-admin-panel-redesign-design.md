# Admin Panel Redesign

## Overview

Replace the current admin dashboard with a full-featured admin panel featuring a dedicated layout with sidebar navigation, comprehensive user/subscription/review management, reports with Chart.js charts, activity logging, and plan settings.

## Architecture

### Layout

```
/admin
  /dashboard     — glavna tabla sa statistikom i brzim pregledom
  /korisnici     — tabela svih korisnika sa pretragom i filtriranjem
  /pretplate     — sve pretplate, ručno dodavanje, produženje
  /recenzije     — upravljanje recenzijama (prikaz/sakrij)
  /izvestaji     — grafikoni (Chart.js): prihodi, registracije, pretplate
  /aktivnosti    — log aktivnosti sistema
  /podesavanja   — upravljanje planovima (cene, aktivnost)
```

All routes are children of a parent `admin-layout` route guarded by `AdminGuard`.

### Layout Component

`AdminLayoutComponent` provides:
- **Sidebar** (240px, dark background): logo, nav links, logout button
- **Content area** with `<router-outlet>`
- No regular site header/footer
- Responsive: sidebar collapses to hamburger on mobile

### New Backend Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/admin/users | All users with search/filter |
| GET | /api/admin/activity-log | Activity log entries |
| GET | /api/admin/reports/registrations | Registrations per month |
| GET | /api/admin/reports/subscriptions | Subscriptions breakdown |
| GET | /api/admin/plans | List subscription plans |
| PUT | /api/admin/plans/:id | Update a plan |

### New Database Table

```sql
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id),
  user_email text,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Frontend Dependencies

- `chart.js` + `ng2-charts` — for reports
- `@angular/cdk` — for modals and overlays

## Sections

### 1. Admin Layout & Sidebar

**Files:**
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.ts`
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.html`
- Create: `frontend/src/app/layouts/admin-layout/admin-layout.component.scss`

**Routing change:**
- Parent route: `{ path: 'admin', component: AdminLayoutComponent, canActivate: [AdminGuard], children: [...] }`
- All existing admin routes become children of this layout

**Sidebar items:**
- Dashboard, Korisnici, Pretplate, Recenzije, Izveštaji, Aktivnosti, Podešavanja

### 2. Dashboard

Extend existing `AdminDashboardComponent` with more stat cards and a small Chart.js chart showing registrations over the last 6 months.

### 3. Users

**Files:**
- Rewrite: `frontend/src/app/pages/admin-users/admin-users.component.ts`
- Rewrite: `frontend/src/app/pages/admin-users/admin-users.component.html`

**Features:**
- Table: Ime, Email, Uloga, Status (approved/pending/rejected), Datum
- Search input (by name or email)
- Filter by role (all/performer/client/admin)
- Click row → modal with full user details and action buttons

**Backend changes:**
- `GET /api/admin/users` — returns joined data from `profiles` and `performers`, supports `?search=&role=` query params

### 4. Subscriptions

**Files:**
- Rewrite: `frontend/src/app/pages/admin-subscriptions/admin-subscriptions.component.ts`
- Rewrite: `frontend/src/app/pages/admin-subscriptions/admin-subscriptions.component.html`

**Features:**
- Table: Izvođač, Plan, Iznos, Period (start-end), Status, Payment method
- "Dodaj pretplatu" button → modal
- Filter by status (active/expired/cancelled)
- Actions: extend, cancel

### 5. Reviews

**Files:**
- Rewrite: `frontend/src/app/pages/admin-reviews/admin-reviews.component.ts`
- Rewrite: `frontend/src/app/pages/admin-reviews/admin-reviews.component.html`

**Features:**
- Table: Izvođač, Korisnik, Ocena, Komentar (truncated), Status, Datum
- Toggle visibility button
- Filter by status

### 6. Reports (Chart.js)

**Files:**
- Rewrite: `frontend/src/app/pages/admin-stats/admin-stats.component.ts` → becomes reports page
- Create: `frontend/src/app/pages/admin-stats/admin-stats.component.html`

**Charts:**
- Bar chart: New registrations per month (last 12 months)
- Line chart: Revenue/subscriptions over time
- Pie chart: Subscription plan distribution
- Pie chart: Performer status distribution

### 7. Activity Log

**Files:**
- Create: `frontend/src/app/pages/admin-activity/admin-activity.component.ts`
- Create: `frontend/src/app/pages/admin-activity/admin-activity.component.html`
- Create: `backend/src/app/api/admin/activity-log/route.ts`

**Features:**
- Reverse-chronological list of activities
- Each entry: user email, action, timestamp
- Search by action or user email
- Filter by date range

### 8. Settings (Plans)

**Files:**
- Create: `frontend/src/app/pages/admin-settings/admin-settings.component.ts`
- Create: `frontend/src/app/pages/admin-settings/admin-settings.component.html`
- Create: `backend/src/app/api/admin/plans/route.ts` — GET all plans
- Create: `backend/src/app/api/admin/plans/[id]/route.ts` — PUT update plan

**Features:**
- List of subscription plans with editable name, price, active toggle
- Save button per plan
