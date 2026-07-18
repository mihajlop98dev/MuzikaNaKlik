# Phase 1 — Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the entire project foundation — Supabase schema + RLS, Next.js backend, Angular frontend, and auth system.

**Architecture:** Monorepo with `frontend/` (Angular standalone), `backend/` (Next.js App Router), and `supabase/` (migrations). Backend serves Angular build in production. Supabase handles all data/auth/storage.

**Tech Stack:** Angular 19 (standalone), Next.js 15 (App Router), Supabase (Postgres + Auth + Storage), Tailwind CSS, Stripe (prepared for later)

---

### Task 1: Initialize project structure

**Files:**
- Create: `package.json` (root)
- Create: `backend/package.json`
- Create: `backend/next.config.js`
- Create: `backend/tsconfig.json`
- Create: `frontend/package.json`
- Create: `frontend/angular.json`
- Create: `frontend/tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "muzika-na-klik",
  "private": true,
  "scripts": {
    "dev:frontend": "cd frontend && ng serve --proxy-config proxy.conf.json",
    "dev:backend": "cd backend && npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build:frontend": "cd frontend && ng build --configuration production",
    "build": "npm run build:frontend && cp -r frontend/dist/muzika-na-klik/browser/* backend/public/",
    "start": "cd backend && npm run start"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
.next/
dist/
.env
.env.local
.env.production
backend/public/*
!backend/public/.gitkeep
```

- [ ] **Step 3: Create backend/package.json**

```json
{
  "name": "muzika-na-klik-backend",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.47.0",
    "stripe": "^17.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 4: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": "."
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create backend/next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

- [ ] **Step 6: Create frontend/angular.json and frontend/tsconfig.json**

Run: `cd frontend && npx @angular/cli@latest new muzika-na-klik --standalone --routing --style=css --directory . --force --skip-git`

After scaffolding, add the proxy config:

Create `frontend/proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  },
  "/api/auth": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

- [ ] **Step 7: Create supabase/migrations directory and .gitkeep**

Create directories:
- `supabase/migrations/.gitkeep`

- [ ] **Step 8: Create backend/public/.gitkeep**

```bash
mkdir -p backend/public && touch backend/public/.gitkeep
```

- [ ] **Step 9: Initial commit**

```bash
git init
git add -A
git commit -m "chore: scaffold monorepo structure"
```

---

### Task 2: Supabase schema migration (profiles + performers + media)

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 001_schema.sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== PROFILES =====
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'performer', 'admin')) DEFAULT 'client',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PERFORMERS =====
CREATE TABLE performers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stage_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('singer', 'band', 'dj')),
  city text,
  genres text[] DEFAULT '{}',
  description text,
  price_from numeric CHECK (price_from >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  subscription_status text NOT NULL CHECK (subscription_status IN ('none', 'active', 'expired')) DEFAULT 'none',
  subscription_expires_at timestamptz,
  rating_avg numeric DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  rating_count integer DEFAULT 0 CHECK (rating_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== PERFORMER MEDIA =====
CREATE TABLE performer_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_performer_media_performer ON performer_media(performer_id);

-- ===== PERFORMER AVAILABILITY =====
CREATE TABLE performer_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('free', 'booked')) DEFAULT 'free',
  UNIQUE(performer_id, date)
);

CREATE INDEX idx_availability_performer ON performer_availability(performer_id);

-- ===== INQUIRIES =====
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text,
  event_date date,
  location text,
  message text,
  status text NOT NULL CHECK (status IN ('new', 'read', 'responded')) DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_performer ON inquiries(performer_id);
CREATE INDEX idx_inquiries_client ON inquiries(client_id);

-- ===== REVIEWS =====
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL CHECK (status IN ('visible', 'hidden')) DEFAULT 'visible',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, performer_id)
);

CREATE INDEX idx_reviews_performer ON reviews(performer_id);

-- ===== SUBSCRIPTION PLANS =====
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== SUBSCRIPTIONS =====
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  performer_id uuid NOT NULL REFERENCES performers(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('manual', 'stripe')),
  stripe_session_id text,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  marked_by_admin uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_performer ON subscriptions(performer_id);
```

- [ ] **Step 2: Create seed data for subscription plans**

Create `supabase/seed.sql`:
```sql
INSERT INTO subscription_plans (name, price, is_active) VALUES
  ('Basic', 1990, true),
  ('Featured', 3990, true),
  ('Premium', 7990, true);
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add supabase schema for profiles, performers, reviews, subscriptions"
```

---

### Task 3: Supabase RLS policies

**Files:**
- Create: `supabase/migrations/002_rls.sql`

- [ ] **Step 1: Write RLS policies**

```sql
-- 002_rls.sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE performer_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE performer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== PERFORMERS =====
-- Public: only approved + active subscription
CREATE POLICY "Public can view approved performers"
  ON performers FOR SELECT
  USING (status = 'approved' AND subscription_status = 'active');

-- Performer: can view own profile regardless of status
CREATE POLICY "Performers can view own profile"
  ON performers FOR SELECT
  USING (auth.uid() = id);

-- Performer: can update own profile
CREATE POLICY "Performers can update own profile"
  ON performers FOR UPDATE
  USING (auth.uid() = id);

-- Admin: can view and update all
CREATE POLICY "Admins can view all performers"
  ON performers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all performers"
  ON performers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== PERFORMER MEDIA =====
CREATE POLICY "Public can view media of approved performers"
  ON performer_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_media.performer_id
    AND status = 'approved' AND subscription_status = 'active'
  ));

CREATE POLICY "Performers can manage own media"
  ON performer_media FOR ALL
  USING (auth.uid() = performer_id);

-- ===== PERFORMER AVAILABILITY =====
CREATE POLICY "Public can view availability"
  ON performer_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM performers
    WHERE id = performer_availability.performer_id
    AND status = 'approved' AND subscription_status = 'active'
  ));

CREATE POLICY "Performers can manage own availability"
  ON performer_availability FOR ALL
  USING (auth.uid() = performer_id);

-- ===== INQUIRIES =====
CREATE POLICY "Performers can view own inquiries"
  ON inquiries FOR SELECT
  USING (performer_id IN (
    SELECT id FROM performers WHERE id = auth.uid()
  ));

CREATE POLICY "Performers can update inquiry status"
  ON inquiries FOR UPDATE
  USING (performer_id IN (
    SELECT id FROM performers WHERE id = auth.uid()
  ));

CREATE POLICY "Clients can view own inquiries"
  ON inquiries FOR SELECT
  USING (client_id = auth.uid());

-- Anyone can insert (guests allowed)
CREATE POLICY "Anyone can create inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== REVIEWS =====
CREATE POLICY "Public can view visible reviews"
  ON reviews FOR SELECT
  USING (status = 'visible');

CREATE POLICY "Clients can create reviews from own inquiries"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = review.inquiry_id
      AND inquiries.client_id = auth.uid()
      AND inquiries.performer_id = review.performer_id
    )
  );

CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can moderate reviews"
  ON reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== SUBSCRIPTIONS =====
CREATE POLICY "Performers can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (performer_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ===== SUBSCRIPTION PLANS =====
CREATE POLICY "Public can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON subscription_plans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

- [ ] **Step 2: Create auto-profile trigger**

Create `supabase/migrations/003_triggers.sql`:
```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );

  -- If performer, create performer record
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'performer' THEN
    INSERT INTO public.performers (id, stage_name, type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'stage_name', 'Unnamed'),
      COALESCE(NEW.raw_user_meta_data->>'type', 'singer')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add RLS policies and auto-profile trigger"
```

---

### Task 4: Next.js backend skeleton

**Files:**
- Create: `backend/src/lib/supabase-admin.ts`
- Create: `backend/src/lib/supabase-client.ts`
- Create: `backend/src/middleware.ts`
- Create: `backend/src/app/layout.tsx`
- Create: `backend/src/app/page.tsx`
- Create: `backend/src/app/api/health/route.ts`
- Create: `backend/.env.local`

- [ ] **Step 1: Create supabase admin client**

`backend/src/lib/supabase-admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

- [ ] **Step 2: Create supabase client for API routes**

`backend/src/lib/supabase-client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create auth middleware**

`backend/src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/performers',
  '/api/inquiries',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

- [ ] **Step 4: Create layout and health endpoint**

`backend/src/app/layout.tsx`:
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

`backend/src/app/page.tsx`:
```typescript
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/api/health');
}
```

`backend/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

- [ ] **Step 5: Create .env.local template**

`backend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 6: Verify backend starts**

```bash
cd backend && npm install && npm run dev
```
Expected: Server starts on port 3000, `GET /api/health` returns `{ "status": "ok" }`

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: scaffold Next.js backend with Supabase clients and auth middleware"
```

---

### Task 5: Angular frontend skeleton with auth

**Files:**
- Modify: `frontend/src/main.ts`
- Create: `frontend/src/app/app.config.ts`
- Create: `frontend/src/app/app.routes.ts`
- Create: `frontend/src/app/app.component.ts`
- Create: `frontend/src/app/app.component.html`
- Create: `frontend/src/app/services/api.service.ts`
- Create: `frontend/src/app/services/auth.service.ts`
- Create: `frontend/src/app/services/supabase.service.ts`
- Create: `frontend/src/app/pages/home/home.component.ts`
- Create: `frontend/src/app/pages/home/home.component.html`
- Create: `frontend/src/app/pages/login/login.component.ts`
- Create: `frontend/src/app/pages/login/login.component.html`
- Create: `frontend/src/app/pages/register/register.component.ts`
- Create: `frontend/src/app/pages/register/register.component.html`
- Create: `frontend/src/styles.css`

- [ ] **Step 1: Install Angular dependencies**

```bash
cd frontend
npm install @supabase/supabase-js
ng add @angular/router --skip-confirmation
```

- [ ] **Step 2: Create environment files**

`frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'your_supabase_url',
  supabaseAnonKey: 'your_supabase_anon_key',
  apiUrl: 'http://localhost:3000/api',
};
```

`frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'your_supabase_url',
  supabaseAnonKey: 'your_supabase_anon_key',
  apiUrl: '/api',
};
```

- [ ] **Step 3: Create Supabase service**

`frontend/src/app/services/supabase.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  get client() {
    return this.supabase;
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  signUp(email: string, password: string, metadata: Record<string, any>) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }
}
```

- [ ] **Step 4: Create API service**

`frontend/src/app/services/api.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { switchMap, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private supabase: SupabaseService
  ) {}

  private getHeaders() {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return [new HttpHeaders(headers)];
      })
    );
  }

  get<T>(path: string) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get<T>(`${environment.apiUrl}${path}`, { headers })
      )
    );
  }

  post<T>(path: string, body: any) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post<T>(`${environment.apiUrl}${path}`, body, { headers })
      )
    );
  }

  put<T>(path: string, body: any) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.put<T>(`${environment.apiUrl}${path}`, body, { headers })
      )
    );
  }
}
```

- [ ] **Step 5: Create app.config.ts**

`frontend/src/app/app.config.ts`:
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
```

- [ ] **Step 6: Create routes**

`frontend/src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'prijava',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registracija',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
];
```

- [ ] **Step 7: Create app component**

`frontend/src/app/app.component.ts`:
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
```

- [ ] **Step 8: Create page placeholders**

`frontend/src/app/pages/home/home.component.ts`:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `<h1>Muzika Na Klik</h1><p>Home page coming soon</p>`,
})
export class HomeComponent {}
```

`frontend/src/app/pages/login/login.component.ts`:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `<h1>Prijava</h1>`,
})
export class LoginComponent {}
```

`frontend/src/app/pages/register/register.component.ts`:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: true,
  template: `<h1>Registracija</h1>`,
})
export class RegisterComponent {}
```

- [ ] **Step 9: Create global styles (Tailwind + base)**

`frontend/src/styles.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0a0a0d;
  --bg-alt: #101013;
  --card: #17161b;
  --card-border: #2a2620;
  --gold: #d9ae5c;
  --gold-soft: #e8c98a;
  --text: #f3f2ef;
  --text-muted: #9a989f;
  --radius: 14px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4 {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  letter-spacing: -0.01em;
}

a { text-decoration: none; color: inherit; }
```

- [ ] **Step 10: Update angular.json to include Tailwind**

Modify `frontend/angular.json` to add:
```json
"styles": ["src/styles.css"],
```

Also install Tailwind:
```bash
cd frontend && npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

Create `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0d',
        'bg-alt': '#101013',
        card: '#17161b',
        'card-border': '#2a2620',
        gold: '#d9ae5c',
        'gold-soft': '#e8c98a',
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 11: Verify frontend builds**

```bash
cd frontend && npm install && npm run build
```
Expected: Build succeeds, `dist/muzika-na-klik/` created.

- [ ] **Step 12: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Angular frontend with Supabase auth and API services"
```

---

### Task 6: Auth API routes (Next.js)

**Files:**
- Create: `backend/src/app/api/auth/register/route.ts`
- Create: `backend/src/app/api/auth/login/route.ts`
- Create: `backend/src/app/api/auth/me/route.ts`

- [ ] **Step 1: Register endpoint**

`backend/src/app/api/auth/register/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const { email, password, role, stage_name, type } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const validRoles = ['client', 'performer'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  if (role === 'performer' && !stage_name) {
    return NextResponse.json(
      { error: 'Stage name is required for performers' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: '',
      stage_name: stage_name || null,
      type: type || null,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { user: { id: data.user.id, email: data.user.email, role } },
    { status: 201 }
  );
}
```

- [ ] **Step 2: Login endpoint**

`backend/src/app/api/auth/login/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    },
  });
}
```

- [ ] **Step 3: Me endpoint (get current user)**

`backend/src/app/api/auth/me/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return NextResponse.json({ user: { ...data.user, ...profile } });
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/app/api/auth/
git commit -m "feat: add auth API routes (register, login, me)"
```

---

### Task 7: Supabase project setup and initial sync

- [ ] **Step 1: Create Supabase project**

Go to https://supabase.com and create a new project named `muzika-na-klik`.

- [ ] **Step 2: Run migrations**

In Supabase SQL Editor, run the contents of:
1. `001_schema.sql`
2. `002_rls.sql`
3. `003_triggers.sql`
4. `seed.sql`

- [ ] **Step 3: Update .env.local files**

Fill in the Supabase project URL, anon key, and service role key in:
- `backend/.env.local`
- `frontend/src/environments/environment.ts`
- `frontend/src/environments/environment.prod.ts`

- [ ] **Step 4: Verify auth flow end-to-end**

```bash
# Start backend
cd backend && npm run dev

# In another terminal, test register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","role":"client"}'
```
Expected: Returns 201 with user object.

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
Expected: Returns user + session with access_token.

```bash
# Test me endpoint
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```
Expected: Returns user profile.

- [ ] **Step 5: Commit final setup**

```bash
git add -A
git commit -m "feat: complete Phase 1 setup with Supabase, auth, and project skeleton"
```

---

### Phase 1 Completion Check

- [ ] Monorepo structure created with frontend/ and backend/
- [ ] All Supabase migrations applied
- [ ] RLS policies active on all tables
- [ ] Auto-profile trigger working on signup
- [ ] Next.js backend starts and serves health endpoint
- [ ] Angular frontend builds without errors
- [ ] Auth API: register, login, me — all working
- [ ] Tailwind configured with custom theme variables
- [ ] Seed data for subscription plans inserted
