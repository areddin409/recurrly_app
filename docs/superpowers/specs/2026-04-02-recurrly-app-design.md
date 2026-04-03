# Recurrly App — Design Spec
**Date:** 2026-04-02  
**Stack:** Expo 54 · React Native 0.81.5 · React 19 · Expo Router v6 · NativeWind v5 · Clerk · Convex · Clerk Billing

---

## Overview

Recurrly is a subscription tracker mobile app targeting iOS and Android (App Store + Google Play). Users track recurring subscriptions, view upcoming renewals, and (on the paid tier) analyze spending trends over time.

**Monetization model:** Free tier includes full subscription tracking. Paid (Pro) tier unlocks analytics, spending history, export, and multi-currency display. Billing is web-only via Clerk Billing — no in-app purchase, no store cut. The app checks entitlement from the Clerk session token.

---

## Design Language

Extracted from Figma file `m3jtoedc0WWAoG6kiJZtxz` (Subscription Management App).

| Token | Value | Usage |
|---|---|---|
| `cream` | `#FFF9E3` | Page backgrounds |
| `coral` | `#EA7A53` | Primary CTA, active tab, balance banner |
| `navy` | `#08121A` | Text, tab bar background |
| `muted` | `#435875` | Secondary text |
| `accent-blue` | `#99B7DD` | Subscription card accent |
| `accent-yellow` | `#F7D44C` | Subscription card accent |
| `accent-teal` | `#8BCBB8` | Subscription card accent |
| `card-bg` | `#F6ECC9` | Chart / info card background |

Subscription cards cycle through the three accent colors on creation and store the assigned color in the database.

---

## Architecture

**Approach:** Computed Convex — the Convex backend handles all data queries including derived/aggregated data. The client renders what Convex returns; it does not compute analytics or perform business logic.

**Provider order (root `_layout.tsx`):**
```
ClerkProvider → ConvexProviderWithClerk → Stack
```

**Feature gating — two layers:**
1. **Client (UX):** `useAuth().has({ feature: "pro" })` gates the Insights tab and export/currency UI — shows paywall instead of content.
2. **Convex (trust):** Every gated function calls `verifyEntitlement(ctx)` before returning data. The client layer is for UX only; Convex is the security boundary.

---

## Route Tree

```
app/
├── _layout.tsx                # Root layout: providers + Stack
├── index.tsx                  # Splash screen → auth redirect
├── (auth)/
│   ├── _layout.tsx            # Auth stack (no tab bar)
│   └── sign-in.tsx            # Clerk SignIn + sign-up link
└── (tabs)/
    ├── _layout.tsx            # Tab bar layout
    ├── index.tsx              # Home
    ├── subscriptions.tsx      # My Subscriptions
    ├── insights.tsx           # Monthly Insights (Pro)
    ├── settings.tsx           # Settings
    └── subscription/
        ├── add.tsx            # Add subscription (modal)
        └── [id].tsx           # Edit/detail subscription (modal)
```

**Navigation flow:**
- App opens → splash → Clerk session check
  - Not signed in → `(auth)/sign-in`
  - Signed in → `(tabs)/` (Home)
- Tapping a subscription or the add button → sheet modal over current tab
- Tapping Insights tab without Pro entitlement → paywall modal

---

## Data Model

```typescript
// convex/schema.ts
subscriptions: defineTable({
  userId: v.string(),           // Clerk user ID
  name: v.string(),             // "Netflix", "Spotify"
  amount: v.number(),           // stored as float (e.g. 9.99)
  currency: v.string(),         // ISO 4217, default "USD"
  billingCycle: v.union(
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly")
  ),
  nextBillingDate: v.number(),  // Unix timestamp (ms)
  category: v.optional(v.string()),
  accentColor: v.optional(v.string()), // hex from accent palette
  iconUrl: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("cancelled")
  ),
  notes: v.optional(v.string()),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_user_next_billing", ["userId", "nextBillingDate"]),
```

No separate `users` table — Clerk is the source of truth for user identity. Convex stores only subscription records.

**Convex queries:**

| Function | Returns | Gated |
|---|---|---|
| `subscriptions.getAll` | All active subs for user | No |
| `subscriptions.getUpcoming` | Next N renewals within 30 days | No |
| `subscriptions.getMonthlySummary` | Spending grouped by month (7 months) | Pro |
| `subscriptions.getHistory` | Past billing dates derived from `nextBillingDate` rolling back by cycle | Pro |

**Convex mutations:** `create`, `update`, `remove` — all verify `userId` matches Clerk session.

**Monthly total** (Home balance banner): computed inside `getAll` — normalizes all cycles to a monthly equivalent (weekly × 4.33, yearly ÷ 12) and sums.

---

## Screens

### Splash (`app/index.tsx`)
- Coral background (`#EA7A53`), centered logo + tagline "Gain Financial Clarity"
- Subtitle: "Track, analyze and cancel with ease"
- "Get Started" CTA button (white, navy text)
- On mount: check Clerk session → redirect (no spinner, splash IS the loading state)

### Login (`(auth)/sign-in.tsx`)
- Cream background
- Clerk `<SignIn />` component styled to match Figma (coral primary button)
- "New to Recurrly? Create an account" text link → Clerk sign-up flow
- On success: redirect to `(tabs)/`

### Home (`(tabs)/index.tsx`)
Three sections within a scrollable container:

1. **Balance banner** (coral card): displays total monthly spend (sum of all active subscriptions normalized to monthly). Shows user greeting top-left, add button (`+`) top-right.
2. **Upcoming** (horizontal scroll): next 3–5 renewals within 30 days. Each card: subscription name, days until renewal, amount. Sourced from `getUpcoming`.
3. **All Subscriptions** (vertical list): all active subscriptions. Each row: accent color left border, name, billing cycle, next date, amount. Tapping opens edit modal.

### My Subscriptions (`(tabs)/subscriptions.tsx`)
- Header: "My Subscriptions", back chevron (navigates up), `...` overflow menu (sort: by date / by amount / by name)
- Full vertical list of all subscriptions (same row style as Home)
- **Upsell card** (teal accent, `#8BCBB8`) shown mid-list to free users: brief Pro pitch + "Upgrade" CTA. Hidden for Pro users.
- FAB or header `+` button → add subscription modal

### Add / Edit Subscription (modal sheet)
Reused for both add and edit. Fields:
- Name (text)
- Amount (numeric)
- Billing cycle (weekly / monthly / yearly — segmented control)
- Next billing date (date picker)
- Category (optional, text or picker)
- Notes (optional, text)

Accent color auto-assigned on create (cycles blue → yellow → teal → blue…), not user-selectable in v1.

### Monthly Insights (`(tabs)/insights.tsx`)
**Pro only.** On mount, check entitlement:
- **Free user:** show paywall modal (see below)
- **Pro user:** render insights

Content:
1. **Bar chart**: monthly spend for the last 7 months. Active/current month highlighted in coral, others in navy. Tap a bar → hover stat shows exact amount.
2. **Upcoming** sub-section: next renewal (single row, sourced from `getUpcoming`)
3. **History** list: past billing events, 3 shown with "View All" link

### Paywall (modal)
Full-screen modal. Lists Pro features with checkmarks. "Upgrade" button → opens Clerk Billing URL via `expo-web-browser`. Dismiss returns to previous screen.

### Settings (`(tabs)/settings.tsx`)
- Account section: avatar, name, email (from Clerk)
- Subscription status: "Free" or "Pro" badge; "Upgrade to Pro" CTA for free users
- Notifications: toggle (placeholder — implementation deferred)
- Sign out button

---

## Tab Bar

Dark navy (`#08121A`) background, coral (`#EA7A53`) filled circle behind active icon.

| Index | Label | Icon | Route | Gated |
|---|---|---|---|---|
| 0 | Home | `home` | `(tabs)/` | No |
| 1 | Subscriptions | `wallet` | `(tabs)/subscriptions` | No |
| 2 | Insights | `activity` | `(tabs)/insights` | Paywall if free |
| 3 | Settings | `setting-2` | `(tabs)/settings` | No |

Insights tab is always visible — tapping it for free users shows the paywall modal. This is intentional for conversion (visible > hidden).

---

## Feature Matrix

| Feature | Free | Pro |
|---|---|---|
| Add/edit/delete subscriptions | ✓ | ✓ |
| Upcoming renewals (Home) | ✓ | ✓ |
| All Subscriptions list | ✓ | ✓ |
| Monthly Insights (bar chart) | — | ✓ |
| Spending history | — | ✓ |
| Export (CSV/JSON) | — | ✓ |
| Multi-currency display | — | ✓ |

---

## Deferred / Out of Scope (v1)

- **Push notifications** — toggle placeholder exists in Settings. Implementation deferred pending decision on notification strategy (Expo Push + Convex scheduled functions is the likely path).
- **Multi-currency conversion** — currency field stored, conversion display deferred to Pro v2.
- **Export** — UI placeholder in Settings, implementation deferred.
- **Social/shared subscriptions** — not in scope.
- **Web app** — mobile only for v1. `app.json` has `web.output: static` but this is not a target for v1.
