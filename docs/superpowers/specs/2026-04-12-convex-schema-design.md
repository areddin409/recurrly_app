# Recurrly — Convex Schema Design
**Date:** 2026-04-12  
**Scope:** `convex/schema.ts` — all four tables: `subscriptions`, `users`, `userBilling`, `billingEvents`

---

## Overview

Four flat tables, all keyed by `tokenIdentifier` (Convex's canonical stable user ID from `ctx.auth.getUserIdentity()`). Insights are computed on-the-fly by Convex queries — no stored snapshot table. Billing state is persisted in Convex via webhook so entitlement checks don't depend solely on the Clerk session token.

**Key identity rule:** Always use `identity.tokenIdentifier`, never `identity.subject`, for database lookups and ownership checks. This matches the Convex auth guidelines.

---

## Table Designs

### `subscriptions`

Stores each user's recurring subscriptions. One record per subscription.

```ts
subscriptions: defineTable({
  tokenIdentifier: v.string(),     // Convex canonical user ID
  name: v.string(),                // e.g. "Netflix", "Spotify"
  amount: v.number(),              // e.g. 9.99
  currency: v.string(),            // ISO 4217, default "USD"
  billingCycle: v.union(
    v.literal("weekly"),
    v.literal("monthly"),
    v.literal("yearly")
  ),
  nextBillingDate: v.number(),     // Unix ms
  category: v.optional(v.string()),
  accentColor: v.optional(v.string()), // hex from accent palette
  iconUrl: v.optional(v.string()),
  paymentMethod: v.optional(v.string()), // e.g. "Visa ending in 8530" — user-entered, display only
  startDate: v.optional(v.number()),     // Unix ms — when subscription started
  status: v.union(
    v.literal("active"),
    v.literal("paused"),
    v.literal("cancelled")
  ),
  notes: v.optional(v.string()),
})
  .index("by_user", ["tokenIdentifier"])
  .index("by_user_status", ["tokenIdentifier", "status"])
  .index("by_user_next_billing", ["tokenIdentifier", "nextBillingDate"])
```

**Indexes:**
- `by_user` — fetch all subscriptions for a user
- `by_user_status` — fetch only active/paused/cancelled subscriptions
- `by_user_next_billing` — fetch upcoming renewals sorted by date

**Notes:**
- `accentColor` cycles through the three accent palette colors (blue → yellow → teal) on creation, not user-selectable in v1
- `amount` stored as float; currency conversion is a Pro v2 feature
- `paymentMethod` is user-entered display text (not verified against a payment processor); rendered in expanded card view
- `startDate` is optional Unix ms; rendered in expanded card view as "Started: [date]". Not required on create.
- `iconUrl` is a URL string; when passed to React Native `<Image>`, must be wrapped as `{ uri: iconUrl }` — this is a component mapping concern, not a schema concern
- `plan` is intentionally omitted — the component falls back to `category` for the sub-label; plan-tier info can live in `notes` or the service name
- Changed from original spec: `userId` → `tokenIdentifier` to match Convex auth guidelines

---

### `users`

Stores stable user preferences. One record per user, created on first sign-in with defaults.

```ts
users: defineTable({
  tokenIdentifier: v.string(),          // Convex canonical user ID ({issuer}|{subject})
  clerkUserId: v.string(),              // Clerk userId (identity.subject) — for webhook lookups
  preferredCurrency: v.string(),        // ISO 4217, default "USD"
  notificationsEnabled: v.boolean(),    // global toggle (placeholder for v1)
  reminderDaysBefore: v.number(),       // days before renewal to notify, default 3
  theme: v.optional(v.union(
    v.literal("light"),
    v.literal("dark"),
    v.literal("system")
  )),
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_clerk_user_id", ["clerkUserId"])
```

**Indexes:**
- `by_token` — look up user preferences by identity
- `by_clerk_user_id` — webhook lookup: resolve `tokenIdentifier` from Clerk `userId` in event payload

**Notes:**
- `clerkUserId` is `identity.subject` (e.g. `user_xxx`) — required because the billing webhook receives a Clerk userId but Convex needs a `tokenIdentifier` to write billing records. HTTP actions have no auth context so they cannot call `ctx.auth.getUserIdentity()` — they must resolve via this index.
- `theme` is optional — app is light-only in v1, field reserved for future dark mode
- `notificationsEnabled` and `reminderDaysBefore` are placeholders — push notification implementation is deferred to v2
- Record is upserted on first authenticated Convex function call

---

### `userBilling`

Stores the current Pro billing status per user. One record per user, upserted by the Clerk billing webhook on every relevant event. Never append-only — always represents current state.

```ts
userBilling: defineTable({
  tokenIdentifier: v.string(),          // Convex canonical user ID
  clerkSubscriptionId: v.string(),      // Clerk subscription ID
  status: v.union(
    v.literal("active"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("ended")
  ),
  isProActive: v.boolean(),             // denormalized: status === "active"
  currentPeriodEnd: v.optional(v.number()), // Unix ms — when current period expires
  canceledAt: v.optional(v.number()),   // Unix ms — set on subscriptionItem.canceled
  updatedAt: v.number(),                // Unix ms — timestamp of last webhook event
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_clerk_subscription", ["clerkSubscriptionId"])
```

**Indexes:**
- `by_token` — entitlement check: look up billing status by user identity
- `by_clerk_subscription` — webhook lookup: find record by Clerk subscription ID without needing the Convex user ID

**Notes:**
- `isProActive` is a denormalized convenience boolean so entitlement checks are a single field read (`isProActive === true`) rather than a string comparison
- The webhook upserts this record on: `subscription.active`, `subscription.updated`, `subscription.pastDue`, `subscriptionItem.canceled`, `subscriptionItem.ended`
- `canceledAt` is set but the user retains Pro access until `currentPeriodEnd` — Convex entitlement logic should check `currentPeriodEnd > Date.now()` when `status === "canceled"`

---

### `billingEvents`

Append-only audit log. One record written per webhook event, never updated or deleted. Provides a full billing history for debugging and future UI.

```ts
billingEvents: defineTable({
  tokenIdentifier: v.string(),          // Convex canonical user ID
  clerkSubscriptionId: v.string(),      // Clerk subscription ID
  eventType: v.string(),                // e.g. "subscription.active", "subscriptionItem.canceled"
  status: v.optional(v.string()),       // status field from event payload
  rawData: v.optional(v.string()),      // JSON.stringify(event.data) for debugging
  occurredAt: v.number(),               // Unix ms — webhook timestamp or Date.now()
})
  .index("by_token", ["tokenIdentifier"])
  .index("by_token_and_time", ["tokenIdentifier", "occurredAt"])
  .index("by_clerk_subscription", ["clerkSubscriptionId"])
```

**Indexes:**
- `by_token` — fetch all billing events for a user
- `by_token_and_time` — fetch billing history in chronological order (future "billing history" UI)
- `by_clerk_subscription` — look up events by Clerk subscription ID

**Notes:**
- `rawData` stores the full event payload as a JSON string — essential for debugging webhook issues without re-fetching from Clerk
- Records are never mutated after insert — append-only by convention
- `tokenIdentifier` may need to be resolved from `clerkSubscriptionId` if the webhook payload doesn't include it directly; the webhook handler should look up `userBilling` by `clerkSubscriptionId` first

---

## Insights — Computed On-the-Fly

No `insights` table. All analytics are derived from the `subscriptions` table at query time:

| Function | Computes | Gated |
|---|---|---|
| `subscriptions.getAll` | Monthly total (sum of active subs normalized to monthly) | No |
| `subscriptions.getUpcoming` | Next N renewals within 30 days | No |
| `subscriptions.getMonthlySummary` | Spending grouped by month, last 7 months | Pro |
| `subscriptions.getHistory` | Past billing dates derived from `nextBillingDate` rolling back by cycle | Pro |

This is appropriate for v1 — users have 5–20 subscriptions, re-scanning is negligible. A snapshot table can be added in v2 if performance becomes an issue.

---

## Entitlement Check Logic

Two layers (unchanged from original design):

1. **Client (UX):** `useAuth().has({ feature: "pro" })` — gates UI, shows paywall
2. **Convex (security boundary):** `verifyEntitlement(ctx)` — checks `userBilling.isProActive` (and `currentPeriodEnd` for canceled-but-not-expired users) before returning gated data

Convex is the trust boundary. The client check is for UX only.

---

## Webhook → Convex Write Flow

```
Clerk event → billingWebhook.ts (HTTP action)
  → verify svix signature
  → extract clerkUserId and clerkSubscriptionId from event payload
  → look up users by clerkUserId (by_clerk_user_id index) → get tokenIdentifier
  → upsert userBilling by clerkSubscriptionId (current status + tokenIdentifier)
  → insert billingEvents (audit log entry)
  → return 200
```

**Identity resolution:** HTTP actions have no auth context — `ctx.auth.getUserIdentity()` always returns `null`. The webhook must resolve the Convex `tokenIdentifier` by looking up the `users` table via `clerkUserId` (stored as `identity.subject` on first sign-in). If no `users` record exists yet (user signed up but never opened the app), the webhook should store `clerkUserId` only in `userBilling` and defer `tokenIdentifier` resolution until the user's first app session creates the `users` record.
