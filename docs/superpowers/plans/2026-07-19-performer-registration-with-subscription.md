# Performer Registration with Subscription — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subscription plan selection as the final step in performer registration, with auto-approval and fake payment.

**Architecture:** Extend existing `POST /api/auth/register/performer` to accept `plan_id` and `billing_period`. Add public `GET /api/subscription-plans` endpoint. Add Step 5 (plan selection) and Step 6 (success) to registration component. All subscription filtering stays intact.

**Tech Stack:** Next.js API routes (backend), Angular 22 standalone components (frontend), Supabase (database/auth)

---

### Task 1: Create GET /api/subscription-plans endpoint

**Files:**
- Create: `backend/src/app/api/subscription-plans/route.ts`

- [ ] **Step 1: Create the API route file**

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const { data } = await supabaseAdmin
    .from('subscription_plans')
    .select('id, name, price, is_active')
    .eq('is_active', true);

  return NextResponse.json(data || []);
}
```

- [ ] **Step 2: Verify the endpoint works**

Run: `curl -s http://localhost:3000/api/subscription-plans`
Expected: JSON array with Basic, Featured, Premium plans

- [ ] **Step 3: Commit**

```bash
git add backend/src/app/api/subscription-plans/route.ts
git commit -m "feat: add GET /api/subscription-plans endpoint"
```

---

### Task 2: Update middleware to make subscription-plans public

**Files:**
- Modify: `backend/src/middleware.ts:13`

- [ ] **Step 1: Add '/api/subscription-plans' to publicPaths**

```typescript
const publicPaths = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/performers',
  '/api/inquiries',
  '/api/genres',
  '/api/equipment',
  '/api/languages',
  '/api/subscription-plans',
];
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware.ts
git commit -m "fix: make /api/subscription-plans publicly accessible"
```

---

### Task 3: Extend POST /api/auth/register/performer with subscription support

**Files:**
- Modify: `backend/src/app/api/auth/register/performer/route.ts`

- [ ] **Step 1: Rewrite the route to accept plan_id and billing_period**

Replace the entire file content:

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, stage_name, type, city, phone, genres, description, price_from, equipment, languages, member_count, travel_radius, audio_url, profile_image_url, videos, plan_id, billing_period } = await request.json();

    if (!email || !password || !stage_name) {
      return NextResponse.json({ error: 'Email, password, and stage name are required' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'performer', full_name: stage_name, stage_name, type: type || 'singer' },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const isComplete = !!(plan_id && billing_period);

    const performerUpdates: Record<string, any> = {
      stage_name,
      type: type || 'singer',
      city: city || null,
      genres: genres || [],
      description: description || null,
      price_from: price_from || null,
      equipment: equipment || [],
      languages: languages || [],
      member_count: member_count || null,
      travel_radius: travel_radius || null,
      audio_url: audio_url || null,
      profile_image_url: profile_image_url || null,
    };

    if (isComplete) {
      performerUpdates.status = 'approved';
      performerUpdates.subscription_status = 'active';
      performerUpdates.subscription_expires_at = new Date(
        Date.now() + (billing_period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const { error: updateError } = await supabase
      .from('performers')
      .update(performerUpdates)
      .eq('id', authData.user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from('profiles').update({ phone: phone || null }).eq('id', authData.user.id);

    if (videos && Array.isArray(videos) && videos.length > 0) {
      const videoRecords = videos.map((url: string) => ({
        performer_id: authData.user.id,
        type: 'video',
        url: url,
        sort_order: 0,
      }));
      await supabase.from('performer_media').insert(videoRecords);
    }

    if (isComplete) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('price')
        .eq('id', plan_id)
        .single();

      const now = new Date();
      const periodEnd = new Date(now);
      if (billing_period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      await supabase.from('subscriptions').insert({
        performer_id: authData.user.id,
        plan_id,
        amount: plan?.price || 0,
        payment_method: 'manual',
        period_start: now.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'active',
      });
    }

    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (adminProfiles) {
      const adminNotifications = adminProfiles.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'new_performer',
        title: isComplete ? 'Novi izvođač registrovan' : 'Novi izvođač na čekanju',
        message: isComplete
          ? `${stage_name} se registrovao sa aktivnom pretplatom.`
          : `${stage_name} se registrovao i čeka odobrenje.`,
        link: '/admin/izvodjaci',
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    return NextResponse.json({
      user: { id: authData.user.id, email: authData.user.email, role: 'performer' },
    }, { status: 201 });

  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test the endpoint with a test request**

Run: `curl -s -X POST http://localhost:3000/api/auth/register/performer -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123","stage_name":"Test","plan_id":"00000000-0000-0000-0000-000000000000","billing_period":"monthly"}'`
Expected: 201 or appropriate error about invalid UUID

- [ ] **Step 3: Commit**

```bash
git add backend/src/app/api/auth/register/performer/route.ts
git commit -m "feat: extend performer registration with subscription and auto-approval"
```

---

### Task 4: Update frontend registration component — Step 5 (plan selection)

**Files:**
- Modify: `frontend/src/app/pages/register-performer/register-performer.component.ts`
- Modify: `frontend/src/app/pages/register-performer/register-performer.component.html`

- [ ] **Step 1: Add plan and billing state variables to the component**

Add after the existing state variables (after `audioUrl = '';` line 52):

```typescript
  // Step 5 - Subscription
  subscriptionPlans: any[] = [];
  selectedPlanId = '';
  billingPeriod: 'monthly' | 'yearly' = 'monthly';
  submitting = false;
```

- [ ] **Step 2: Load subscription plans in ngOnInit**

Add after the equipment load (after line 70):

```typescript
    this.api.get<any[]>('/subscription-plans').subscribe(data => {
      this.subscriptionPlans = data;
      this.cdr.detectChanges();
    });
```

- [ ] **Step 3: Add plan selection and submit methods**

Add these methods before `toggleGenre`:

```typescript
  selectPlan(id: string) {
    this.selectedPlanId = id;
  }

  getPlanPrice(price: number): number {
    return this.billingPeriod === 'yearly' ? price * 10 : price;
  }

  getPlanPeriod(): string {
    return this.billingPeriod === 'yearly' ? 'godišnje' : 'mesečno';
  }
```

- [ ] **Step 4: Replace the existing submit method**

Replace lines 165-207 (the `submit()` method):

```typescript
  async submit() {
    if (!this.validateStep()) return;
    if (!this.selectedPlanId) { this.error = 'Izaberite paket.'; return; }
    this.submitting = true;
    this.error = '';

    const validVideos = this.videoUrls
      .map(u => this.extractYoutubeId(u))
      .filter((id): id is string => id !== null);

    const allGenres = [...this.selectedGenres, ...this.customGenres.split(',').map(g => g.trim()).filter(Boolean)];
    const allLanguages = [...this.selectedLanguages, ...this.customLanguages.split(',').map(l => l.trim()).filter(Boolean)];
    const allEquipment = [...this.selectedEquipment, ...this.customEquipment.split(',').map(e => e.trim()).filter(Boolean)];

    const payload = {
      email: this.email,
      password: this.password,
      stage_name: this.stageName,
      type: this.performerType,
      city: this.city,
      phone: this.phone,
      genres: allGenres,
      description: this.description,
      price_from: this.priceFrom || null,
      member_count: this.memberCount,
      travel_radius: this.travelRadius || null,
      equipment: allEquipment,
      languages: allLanguages,
      audio_url: this.audioUrl || null,
      profile_image_url: this.profileImageUrl || null,
      videos: validVideos,
      plan_id: this.selectedPlanId,
      billing_period: this.billingPeriod,
    };

    this.api.post('/auth/register/performer', payload).subscribe({
      next: () => {
        this.step = 6;
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        this.submitting = false;
        this.cdr.detectChanges();
      },
    });
  }
```

- [ ] **Step 5: Update validation in validateStep to include plan selection check for step 5**

In `validateStep()`, add after the step 4 case (after line 133):

```typescript
      case 5:
        if (!this.selectedPlanId) { this.error = 'Izaberite paket.'; return false; }
        return true;
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/register-performer/register-performer.component.ts
git commit -m "feat: add plan selection state and submit logic to registration"
```

---

### Task 5: Update registration template — Steps 5 and 6

**Files:**
- Modify: `frontend/src/app/pages/register-performer/register-performer.component.html`

- [ ] **Step 1: Read the current template**

```bash
cat "/Volumes/Extreme Pro/Projects/MuzikaNaKlik/frontend/src/app/pages/register-performer/register-performer.component.html"
```

- [ ] **Step 2: Add Step 5 (plan selection) content**

Add after the step 4 section (after video URL inputs), inside the `*ngSwitchCase="4"` block or after it but before the closing switch:

```html
    <div *ngSwitchCase="5">
      <h2>Izaberite paket</h2>
      <p class="muted" style="margin-bottom:24px">Odaberite pretplatu za vaš profil izvođača.</p>

      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">
        <div *ngFor="let plan of subscriptionPlans"
          (click)="selectPlan(plan.id)"
          style="flex:1;min-width:200px;padding:24px;border:2px solid;border-radius:12px;cursor:pointer;text-align:center"
          [style.border-color]="selectedPlanId === plan.id ? '#2ecc71' : '#ddd'">
          <strong style="font-size:20px;display:block;margin-bottom:8px">{{ plan.name }}</strong>
          <div style="font-size:28px;font-weight:700;margin-bottom:4px">
            {{ getPlanPrice(plan.price) / 100 }}€
          </div>
          <div class="muted">{{ getPlanPeriod() }}</div>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" [checked]="billingPeriod === 'yearly'"
            (change)="billingPeriod = billingPeriod === 'monthly' ? 'yearly' : 'monthly'">
          <span>Godišnje plaćanje (10 meseci po ceni 12)</span>
        </label>
      </div>

      <div style="display:flex;gap:12px">
        <button class="btn btn-outline" (click)="prevStep()">Nazad</button>
        <button class="btn" (click)="submit()" [disabled]="submitting">
          {{ submitting ? 'Obrada...' : 'Završi registraciju' }}
        </button>
      </div>
    </div>

    <div *ngSwitchCase="6">
      <div style="text-align:center;padding:48px 0">
        <div style="font-size:64px;margin-bottom:16px">✅</div>
        <h2 style="margin-bottom:8px">Uspešno ste se registrovali!</h2>
        <p class="muted" style="margin-bottom:24px">Vaš nalog izvođača je aktivan. Sada vas korisnici mogu pronaći u pretrazi.</p>
        <a routerLink="/" class="btn">Idi na početnu</a>
      </div>
    </div>
```

- [ ] **Step 3: Add RouterLink to the component imports**

In `register-performer.component.ts`, update imports list to include `RouterLink`:

Already imported: yes, it's already in the imports array. Verify the `CommonModule` covers `NgSwitch` etc.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/register-performer/register-performer.component.html
git commit -m "feat: add plan selection and success steps to registration wizard"
```

---

### Task 6: Remove admin-approval notification for subscription registrations

Already handled in Task 3 — the notification message changes based on whether it's a complete registration (with subscription) or pending. No additional changes needed.

---

### Task 7: Verify the full flow

- [ ] **Step 1: Restart backend and frontend**

```bash
# Kill both servers if running, then restart
# Frontend:
cd /Volumes/Extreme\ Pro/Projects/MuzikaNaKlik/frontend && ng serve
# Backend (in another terminal):
cd /Volumes/Extreme\ Pro/Projects/MuzikaNaKlik/backend && npm run dev
```

- [ ] **Step 2: Navigate to /registracija-izvodjac**

Go through all 5 steps:
1. Fill basic info
2. Select genres, description
3. Upload profile image (optional)
4. Add video links (optional)
5. Select a plan, toggle yearly, click "Završi registraciju"

Expected: Success page appears, performer is auto-approved with active subscription

- [ ] **Step 3: Verify performer appears in search**

Login as any user, navigate to `/izvodjaci` and search. The new performer should appear.

- [ ] **Step 4: Verify subscription in database**

Check that performers table has `status = 'approved'` and `subscription_status = 'active'` for the new performer.
Check that subscriptions table has a row with `status = 'active'`.

Run: `npx supabase db query "SELECT p.stage_name, p.status, p.subscription_status, s.status as sub_status, s.amount FROM performers p LEFT JOIN subscriptions s ON s.performer_id = p.id WHERE p.stage_name = 'TestPerformer';"`
