# MuzikaNaKlik — Technical Design Document

## Overview

Web platform connecting clients (event organizers) with musical performers (singers, bands, DJs) for weddings, birthdays, christenings, corporate events, and other celebrations. Clients search for performers by city, date, and event type, browse profiles, and send inquiries directly. Performers subscribe monthly for visibility.

Business model: monthly performer subscription (no commission per booking, no online payments on platform — all pricing and payment happens directly between client and performer).

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular (latest stable, standalone components) |
| Backend / API | Next.js (App Router, Route Handlers as REST API) |
| Database / Auth / Storage | Supabase (Postgres + Supabase Auth + Supabase Storage) |
| Styling | Tailwind CSS with custom dark+gold theme |
| Hosting | Vercel (single deploy — Next.js serves both API and Angular build) |

### Project Structure

```
muzika-na-klik/
├── frontend/                    # Angular standalone app
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/          # Page components
│   │   │   ├── components/     # Shared components
│   │   │   ├── services/       # API services
│   │   │   └── models/         # TypeScript interfaces
│   │   └── ...
│   └── angular.json
├── backend/                     # Next.js App Router
│   ├── src/
│   │   ├── app/api/            # Route Handlers (REST)
│   │   ├── lib/                # Supabase client, helpers
│   │   └── middleware.ts       # Auth middleware
│   ├── public/                 # Angular build copied here
│   └── next.config.js
├── supabase/                    # Migrations, RLS policies
│   └── migrations/
└── package.json                 # Root scripts (build pipeline)
```

### Build & Deploy Pipeline

- **Development**: `npm run dev:angular` (port 4200) + `npm run dev:next` (port 3000). Angular proxies `/api/*` to Next.js.
- **Production**: `npm run build` builds Angular, copies `dist/` into `backend/public/`. Vercel sees only `backend/` — Angular static files served through Next.js.
- **Routing**: `/` → Angular app, `/api/*` → Next.js Route Handlers.

### Data Flow

- Angular communicates with Next.js exclusively via REST API calls (Next.js Route Handlers).
- Supabase Auth JWT token forwarded in `Authorization` header.
- Next.js backend uses Supabase service role key for privileged operations (approving performers, managing subscriptions).
- Angular frontend can use Supabase client (anon key) directly for public read operations with RLS policies.

## User Roles

### Client
- Registration/login (email + password, optional Google OAuth)
- No registration required to send inquiry (guest-friendly)
- Search performers (city, date, event type, performer type)
- Browse performer profiles
- Send inquiry to performer (name, email, phone, event type, event date, location, message)
- View inquiry history in account
- Leave review after event (rating 1-5 + comment) — only if previously sent inquiry to that performer

### Performer
- Registration with additional fields (stage name/band name, type: singer/band/DJ, city, genres, "About Us" description, price "from X €")
- Account pending until admin approval
- After approval: choose/pay monthly subscription for public visibility
- Manage profile: image gallery, video (YouTube/Vimeo embed), repertoire (song list/genres), pricing
- Calendar: mark available/blocked dates
- Inbox: received inquiries with status (new, read, responded)
- View reviews

### Admin
- Approve/reject new performer registrations
- View and manage all users (clients, performers)
- Manage subscriptions (active, expired, cancelled) — manual + automated (Stripe)
- Moderate reviews (hide inappropriate)
- Moderate performer profile content (images, descriptions)
- Basic statistics (performer count, client count, monthly inquiries)

## Page Structure

### Public Pages
1. **Home** — hero with search (city, date, event type, performer type), quick filters by event type (Wedding, Birthday, Christening, Corporate, Prom, Other), "Featured Performers" section (cards: image, name, city, rating + review count, price "from X €"), "How It Works" (3 steps: Search → Send Inquiry → Book), client reviews (carousel), CTA section
2. **Performers** — grid with sidebar filters (city, event type, performer type, price range slider), sorting (popularity, price, rating), pagination
3. **Performer Profile** — tabs: About, Gallery, Video, Repertoire, Reviews, Availability; "Send Inquiry" button and "save" (heart icon)
4. **Inquiry Form** — name, email, phone, event type, event date, location, message; sidebar preview card of selected performer
5. **Contact**
6. **Login / Registration** (with role selection: client or performer)

### Client Account
7. My Inquiries (history and status)
8. Account Settings

### Performer Account
9. Dashboard (overview: profile views, inquiry count, subscription status)
10. Edit Profile (basic info, About Us, pricing)
11. Gallery (image upload)
12. Video (embed links)
13. Repertoire (song list/genres)
14. Availability (calendar)
15. Inbox (received inquiries)
16. Subscription (status, history, renewal button)

### Admin Panel
17. Pending Performer Approvals
18. All Users
19. Subscriptions
20. Reviews (moderation)
21. Statistics

## Database Schema

### Tables

```sql
-- Extended Supabase auth.users
profiles (
  id uuid primary key references auth.users,
  role text check (role in ('client','performer','admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
)

-- Performer-specific data
performers (
  id uuid primary key references profiles(id),
  stage_name text not null,
  type text check (type in ('singer','band','dj')),
  city text,
  genres text[],
  description text,
  price_from numeric,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  subscription_status text check (subscription_status in ('none','active','expired')) default 'none',
  subscription_expires_at timestamptz,
  rating_avg numeric default 0,
  rating_count int default 0,
  created_at timestamptz default now()
)

-- Gallery images and video embeds
performer_media (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  type text check (type in ('image','video')),
  url text not null,
  sort_order int default 0
)

-- Availability calendar
performer_availability (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  date date not null,
  status text check (status in ('free','booked')) default 'free'
)

-- Client inquiries
inquiries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),  -- nullable for guests
  performer_id uuid references performers(id),
  full_name text,
  email text,
  phone text,
  event_type text,
  event_date date,
  location text,
  message text,
  status text check (status in ('new','read','responded')) default 'new',
  created_at timestamptz default now()
)

-- Reviews (only by clients who sent inquiry)
reviews (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  client_id uuid references profiles(id),
  inquiry_id uuid references inquiries(id),  -- link back to verify
  rating int check (rating between 1 and 5),
  comment text,
  status text check (status in ('visible','hidden')) default 'visible',
  created_at timestamptz default now()
)

-- Subscription plans
subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  is_active bool default true,
  created_at timestamptz default now()
)

-- Subscription history
subscriptions (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  plan_id uuid references subscription_plans(id),
  amount numeric,
  payment_method text check (payment_method in ('manual','stripe')),
  stripe_session_id text,
  period_start date,
  period_end date,
  status text check (status in ('active','expired','cancelled')),
  marked_by_admin uuid references profiles(id),
  created_at timestamptz default now()
)
```

### RLS Policies (Principle)

- `performers`: public sees only `status = 'approved' AND subscription_status = 'active'`. Performer sees their own row (any status). Admin sees all.
- `inquiries`: performer sees only theirs, client sees theirs, admin sees all.
- `reviews`: public sees `status = 'visible'`, admin sees all.

## Design System

Based on provided HTML/CSS example:

**Colors:**
- Background: `#0A0A0D`
- Background alt: `#101013`
- Card: `#17161B`
- Card border: `#2A2620`
- Gold accent: `#D9AE5C`
- Gold soft: `#E8C98A`
- Text: `#F3F2EF`
- Text muted: `#9A989F`

**Typography:**
- Headings: Sora (700-800 weight)
- Body: Inter (400-500 weight)

**Components (from example):**
- Rounded cards (14px radius), subtle gold-tinted borders
- Gold gradient buttons (linear-gradient on gold-soft → gold)
- Sticky header with backdrop blur, gold active nav indicator
- Hero with gradient scrim overlay over background image
- Search panel: horizontal field groups with icons, semi-transparent dark bg with blur
- Quick filter chips (pill-shaped, gold hover)
- Performer cards: 4:3 aspect ratio image, badge overlay, fav heart button, meta row with star rating + price
- Steps section: 3-column numbered cards
- Review slider card with avatar
- CTA section with overlay background image
- Mobile: single column, stacked search, hidden nav

**Logo:** Headphone with music note icon + "MUZIKA" (white) "NA KLIK" (gold)

## Subscription & Monetization

- Multiple subscription plans (basic, featured, premium) with different visibility levels
- Admin can manually mark subscription as paid (bank transfer/invoice)
- Stripe Checkout integration for automated payment
- Stripe webhook handles subscription lifecycle (active → expired)
- Cron job checks for expired subscriptions daily

## Implementation Phases

### Phase 1 — Setup
- Supabase project (schema from section 5 + RLS policies)
- Next.js backend skeleton
- Angular frontend skeleton
- Auth (registration/login with role selection)

### Phase 2 — Public Pages
- Home page with search and featured performers
- Performer list with filters
- Performer profile page
- Inquiry form

### Phase 3 — Performer Account
- Dashboard
- Profile editing
- Gallery, video, repertoire management
- Availability calendar
- Inquiry inbox

### Phase 4 — Admin Panel
- Performer approval
- Subscription management
- Review moderation
- User management
- Basic statistics

### Phase 5 — Polish
- Client reviews system
- Statistics
- Responsive QA
- SEO basics
- Stripe integration

## Design Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Angular (standalone) | Per original spec |
| Backend | Next.js App Router | API routes + serves Angular on Vercel |
| Clients must register to inquire? | No | Guest-friendly, lower friction |
| Reviews restricted? | Yes | Only clients who sent inquiry |
| Payment on platform? | No | All payment direct between parties |
| Subscription payment | Manual + Stripe | Both options available |
| Deploy | Single Vercel project | Angular → Next.js public/ dir |

## Open Questions (Resolved)

- ~~Single subscription tier or multiple?~~ Multiple plans (basic/featured/premium) — resolved.
- ~~Guest inquiries allowed?~~ Yes — resolved.
- ~~Review eligibility?~~ Only after inquiry — resolved.
