# Performer Registration with Subscription

## Overview

Extend performer registration to require a subscription plan selection (with fake payment) as the final step. When registration completes, the performer is automatically approved with an active subscription.

## Changes

### 1. Registration Flow (Extended)

Existing steps 1-4 remain unchanged. Two new steps:

**Step 5 — Plan Selection:**
- Fetch active plans from `GET /api/subscription-plans` (already public)
- Display 3 cards: Basic (19.90€), Featured (39.90€), Premium (79.90€)
- Toggle between Monthly / Yearly billing:
  - Yearly price = monthly × 10 (saves 2 months)
- "Završi registraciju" button calls new backend endpoint

**Step 6 — Success:**
- Message: "Uspešno ste se registrovali! Vaš nalog je aktivan."
- Button: "Idi na početnu" navigates to `/`

### 2. Extended Backend Endpoint

Existing `POST /api/auth/register/performer` is extended to accept optional `plan_id` and `billing_period`. When provided, the performer is auto-approved with active subscription. When absent, the old behavior applies (status = 'pending', no subscription).

New optional fields in request body — `plan_id` and `billing_period` alongside existing performer registration fields:
```json
{
  "email": "...",
  "password": "...",
  "stage_name": "...",
  "type": "band",
  "city": "...",
  "phone": "...",
  "genres": [...],
  "description": "...",
  "price_from": 0,
  "member_count": 3,
  "travel_radius": "...",
  "equipment": [...],
  "languages": [...],
  "audio_url": "...",
  "profile_image_url": "...",
  "videos": [...],
  "plan_id": "uuid",
  "billing_period": "monthly" | "yearly"
}
```

Response:
```json
{ "success": true }
```

Backend logic:
1. Create Supabase auth user
2. Create performers row with `status = 'approved'`, `subscription_status = 'active'`
3. Calculate `subscription_expires_at` and `period_end` based on billing_period (1 month or 1 year)
4. Insert subscription row with `payment_method = 'manual'`, `status = 'active'`
5. Insert notification for admins
6. Insert video media entries
7. Return success

### 3. Subscription Plans Data

Existing plans in `subscription_plans` table:
| Name | Price (€) | Monthly | Yearly (×10) |
|------|-----------|---------|--------------|
| Basic | 19.90 | 19.90€ | 199.00€ |
| Featured | 39.90 | 39.90€ | 399.00€ |
| Premium | 79.90 | 79.90€ | 799.00€ |

### 4. New Frontend Endpoint

```
GET /api/subscription-plans
```

Returns active plans from `subscription_plans` table. Already readable via RLS.

### 5. Frontend Component Changes

**register-performer.component.ts:**
- Add step 5 (plan selection with billing toggle)
- Add step 6 (success page)
- Extend submit payload to include `plan_id` and `billing_period`

### 6. Auto-Approval + Filter Impact

Since subscription is now a mandatory part of registration:
- `performers.status` = `'approved'` on creation (no admin approval needed)
- `performers.subscription_status` = `'active'` on creation
- Existing `.eq('subscription_status', 'active')` filter in `GET /api/performers` stays correct
- Existing `.eq('status', 'approved')` filter in `GET /api/performers` stays correct

### 7. Admin Approval

The existing admin approval page (`/admin/izvodjaci`) is no longer needed for new performers (they auto-approve). It still serves for edge cases or manual overrides.
