# Convex Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `convex/schema.ts` and all supporting Convex functions — user management, subscription CRUD, Pro-gated analytics queries, and billing webhook persistence.

**Architecture:** Four flat tables (`subscriptions`, `users`, `userBilling`, `billingEvents`) all keyed by `tokenIdentifier`. Insights computed on-the-fly from `subscriptions`. Billing state persisted via Clerk webhook to `userBilling` + `billingEvents`. Entitlement enforced in Convex via `verifyEntitlement()` helper in addition to the client-side Clerk check.

**Tech Stack:** Convex 1.35.1 · Clerk · svix · convex-test · vitest · @edge-runtime/vm

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `convex/auth.config.ts` | Create | Clerk JWT domain for Convex auth |
| `convex/schema.ts` | Create | All 4 table definitions + indexes |
| `convex/lib.ts` | Create | `requireAuth` + `verifyEntitlement` helpers |
| `convex/users.ts` | Create | `ensureUser`, `getPreferences`, `updatePreferences` |
| `convex/subscriptions.ts` | Create | All queries + mutations |
| `convex/billing.ts` | Create | Internal mutations for webhook writes |
| `convex/billingWebhook.ts` | Modify | Upgrade from log-only to DB writes |
| `convex/users.test.ts` | Create | Tests for user functions |
| `convex/subscriptions.test.ts` | Create | Tests for subscription functions |
| `convex/billing.test.ts` | Create | Tests for billing mutations |
| `vitest.config.ts` | Create | Vitest + edge-runtime config |

**No changes needed:** `convex/http.ts` — already routes `/webhooks/clerk-billing` correctly.

---

## Task 1: Convex Auth Config

**Files:**
- Create: `convex/auth.config.ts`

- [ ] **Step 1: Get your Clerk JWT issuer URL**

  In the Clerk Dashboard → Configure → JWT Templates → create a template named **"convex"** (if it doesn't exist). The issuer URL is on that page. It looks like:
  `https://your-instance.clerk.accounts.dev`

  For production with a custom domain it will be your domain. Copy it.

- [ ] **Step 2: Create the config file**

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
}
```

- [ ] **Step 3: Add the env var to Convex**

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-instance.clerk.accounts.dev
```

Replace the URL with your actual issuer URL from Step 1.

- [ ] **Step 4: Commit**

```bash
git add convex/auth.config.ts
git commit -m "feat: add Convex auth config for Clerk JWT"
```

---

## Task 2: Schema

**Files:**
- Create: `convex/schema.ts`

- [ ] **Step 1: Create the schema**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  subscriptions: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    amount: v.number(),
    currency: v.string(),
    billingCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    startDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["tokenIdentifier"])
    .index("by_user_status", ["tokenIdentifier", "status"])
    .index("by_user_next_billing", ["tokenIdentifier", "nextBillingDate"]),

  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    preferredCurrency: v.string(),
    notificationsEnabled: v.boolean(),
    reminderDaysBefore: v.number(),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_user_id", ["clerkUserId"]),

  userBilling: defineTable({
    tokenIdentifier: v.string(),
    clerkSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("ended")
    ),
    isProActive: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_subscription", ["clerkSubscriptionId"]),

  billingEvents: defineTable({
    tokenIdentifier: v.string(),
    clerkSubscriptionId: v.string(),
    eventType: v.string(),
    status: v.optional(v.string()),
    rawData: v.optional(v.string()),
    occurredAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_token_and_time", ["tokenIdentifier", "occurredAt"])
    .index("by_clerk_subscription", ["clerkSubscriptionId"]),
})
```

- [ ] **Step 2: Push schema and verify types regenerate**

```bash
npx convex dev --once
```

Expected: no errors, `convex/_generated/dataModel.d.ts` now has typed tables (no longer `Doc = any`).

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts convex/_generated/
git commit -m "feat: add Convex schema — subscriptions, users, userBilling, billingEvents"
```

---

## Task 3: Install Test Dependencies

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Install convex-test and vitest**

```bash
npm install --save-dev vitest @edge-runtime/vm convex-test
```

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test:convex": "vitest run convex"
```

- [ ] **Step 4: Verify vitest runs (no tests yet)**

```bash
npm run test:convex
```

Expected: `No test files found` or similar — not an error exit.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest + convex-test for Convex unit tests"
```

---

## Task 4: Shared Helpers

**Files:**
- Create: `convex/lib.ts`
- Create: `convex/lib.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// convex/lib.test.ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

test("requireAuth throws when unauthenticated", async () => {
  const t = convexTest(schema, modules)
  await expect(
    t.query(api.subscriptions.getAll)
  ).rejects.toThrow("Unauthenticated")
})

test("verifyEntitlement throws when no billing record", async () => {
  const t = convexTest(schema, modules)
  await expect(
    t.withIdentity({ tokenIdentifier: "clerk|user_test", subject: "user_test" })
     .query(api.subscriptions.getMonthlySummary)
  ).rejects.toThrow("Pro subscription required")
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:convex -- convex/lib.test.ts
```

Expected: FAIL — `api.subscriptions.getAll` and `api.subscriptions.getMonthlySummary` do not exist yet.

- [ ] **Step 3: Create the helpers**

```typescript
// convex/lib.ts
import { QueryCtx, MutationCtx } from "./_generated/server"

type AuthCtx = { auth: QueryCtx["auth"]; db: QueryCtx["db"] }

export async function requireAuth(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthenticated")
  return identity
}

export async function verifyEntitlement(ctx: AuthCtx): Promise<void> {
  const identity = await requireAuth(ctx)
  const billing = await ctx.db
    .query("userBilling")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique()
  if (!billing) throw new Error("Pro subscription required")
  const isActive =
    billing.isProActive ||
    (billing.status === "canceled" &&
      billing.currentPeriodEnd != null &&
      billing.currentPeriodEnd > Date.now())
  if (!isActive) throw new Error("Pro subscription required")
}
```

Note: The tests for `lib.ts` depend on `subscriptions.ts` being built first (Tasks 5–7). The tests will pass after Task 7 is complete — commit `lib.ts` now, run the tests after Task 7.

- [ ] **Step 4: Commit**

```bash
git add convex/lib.ts convex/lib.test.ts
git commit -m "feat: add requireAuth and verifyEntitlement helpers"
```

---

## Task 5: User Functions

**Files:**
- Create: `convex/users.ts`
- Create: `convex/users.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// convex/users.test.ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const IDENTITY = { tokenIdentifier: "clerk|user_abc", subject: "user_abc" }

test("ensureUser creates a user record with defaults", async () => {
  const t = convexTest(schema, modules)
  const user = await t.withIdentity(IDENTITY).mutation(api.users.ensureUser)
  expect(user).toMatchObject({
    tokenIdentifier: "clerk|user_abc",
    clerkUserId: "user_abc",
    preferredCurrency: "USD",
    notificationsEnabled: false,
    reminderDaysBefore: 3,
  })
})

test("ensureUser is idempotent", async () => {
  const t = convexTest(schema, modules)
  const first = await t.withIdentity(IDENTITY).mutation(api.users.ensureUser)
  const second = await t.withIdentity(IDENTITY).mutation(api.users.ensureUser)
  expect(second._id).toBe(first._id)
})

test("getPreferences returns null when unauthenticated", async () => {
  const t = convexTest(schema, modules)
  const prefs = await t.query(api.users.getPreferences)
  expect(prefs).toBeNull()
})

test("getPreferences returns user after ensureUser", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.users.ensureUser)
  const prefs = await t.withIdentity(IDENTITY).query(api.users.getPreferences)
  expect(prefs?.preferredCurrency).toBe("USD")
})

test("updatePreferences patches user fields", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.users.ensureUser)
  await t.withIdentity(IDENTITY).mutation(api.users.updatePreferences, {
    preferredCurrency: "EUR",
    reminderDaysBefore: 5,
  })
  const prefs = await t.withIdentity(IDENTITY).query(api.users.getPreferences)
  expect(prefs?.preferredCurrency).toBe("EUR")
  expect(prefs?.reminderDaysBefore).toBe(5)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:convex -- convex/users.test.ts
```

Expected: FAIL — `api.users` does not exist yet.

- [ ] **Step 3: Implement user functions**

```typescript
// convex/users.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { requireAuth } from "./lib"

export const ensureUser = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()

    if (existing) return existing

    const id = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      clerkUserId: identity.subject,
      preferredCurrency: "USD",
      notificationsEnabled: false,
      reminderDaysBefore: 3,
    })
    const doc = await ctx.db.get(id)
    return doc!
  },
})

export const getPreferences = query({
  args: {},
  handler: async (ctx, _args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
  },
})

export const updatePreferences = mutation({
  args: {
    preferredCurrency: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    reminderDaysBefore: v.optional(v.number()),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (!user) throw new Error("User record not found — call ensureUser first")
    await ctx.db.patch(user._id, args)
  },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:convex -- convex/users.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add convex/users.ts convex/users.test.ts
git commit -m "feat: add user functions — ensureUser, getPreferences, updatePreferences"
```

---

## Task 6: Free Subscription Queries

**Files:**
- Create: `convex/subscriptions.ts`
- Create: `convex/subscriptions.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// convex/subscriptions.test.ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { expect, test, beforeEach } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

const IDENTITY = { tokenIdentifier: "clerk|user_abc", subject: "user_abc" }
const OTHER_IDENTITY = { tokenIdentifier: "clerk|user_xyz", subject: "user_xyz" }

const NOW = Date.now()
const DAYS = (n: number) => n * 24 * 60 * 60 * 1000

function makeSub(overrides: Partial<{
  name: string
  amount: number
  currency: string
  billingCycle: "weekly" | "monthly" | "yearly"
  nextBillingDate: number
  status: "active" | "paused" | "cancelled"
}> = {}) {
  return {
    name: "Netflix",
    amount: 15.99,
    currency: "USD",
    billingCycle: "monthly" as const,
    nextBillingDate: NOW + DAYS(10),
    status: "active" as const,
    ...overrides,
  }
}

test("getAll returns empty when user has no subscriptions", async () => {
  const t = convexTest(schema, modules)
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getAll)
  expect(result.subscriptions).toHaveLength(0)
  expect(result.monthlyTotal).toBe(0)
})

test("getAll returns subscriptions and correct monthlyTotal", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ amount: 10, billingCycle: "monthly" }))
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ name: "Spotify", amount: 120, billingCycle: "yearly" }))
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getAll)
  expect(result.subscriptions).toHaveLength(2)
  // 10 (monthly) + 120/12 (yearly) = 10 + 10 = 20
  expect(result.monthlyTotal).toBeCloseTo(20, 1)
})

test("getAll excludes other users' subscriptions", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub())
  const result = await t.withIdentity(OTHER_IDENTITY).query(api.subscriptions.getAll)
  expect(result.subscriptions).toHaveLength(0)
})

test("getAll monthlyTotal excludes paused subscriptions", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ amount: 10, status: "active" }))
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ name: "Paused", amount: 20, status: "paused" }))
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getAll)
  expect(result.monthlyTotal).toBeCloseTo(10, 1)
})

test("getUpcoming returns only active subs within 30 days", async () => {
  const t = convexTest(schema, modules)
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ name: "Soon", nextBillingDate: NOW + DAYS(5) }))
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ name: "Far", nextBillingDate: NOW + DAYS(45) }))
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ name: "Paused", nextBillingDate: NOW + DAYS(3), status: "paused" }))
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getUpcoming, {})
  expect(result).toHaveLength(1)
  expect(result[0].name).toBe("Soon")
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:convex -- convex/subscriptions.test.ts
```

Expected: FAIL — `api.subscriptions` does not exist yet.

- [ ] **Step 3: Create subscriptions.ts with free queries and helpers**

```typescript
// convex/subscriptions.ts
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireAuth, verifyEntitlement } from "./lib"

type BillingCycle = "weekly" | "monthly" | "yearly"

function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly": return amount * 4.33
    case "monthly": return amount
    case "yearly": return amount / 12
  }
}

function cycleToDays(cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly": return 7
    case "monthly": return 30
    case "yearly": return 365
  }
}

export const getAll = query({
  args: {},
  handler: async (ctx, _args) => {
    const identity = await requireAuth(ctx)
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .take(200)
    const monthlyTotal = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0)
    return { subscriptions, monthlyTotal }
  },
})

export const getUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const limit = args.limit ?? 5
    const now = Date.now()
    const cutoff = now + 30 * 24 * 60 * 60 * 1000
    const candidates = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_next_billing", (q) =>
        q
          .eq("tokenIdentifier", identity.tokenIdentifier)
          .gte("nextBillingDate", now)
      )
      .take(limit * 3)
    return candidates
      .filter((s) => s.status === "active" && s.nextBillingDate <= cutoff)
      .slice(0, limit)
  },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:convex -- convex/subscriptions.test.ts
```

Expected: FAIL on mutation tests (create not defined yet), but `getAll` and `getUpcoming` tests should error clearly. Move to Task 7 to add mutations, then re-run.

Actually: all tests fail because `api.subscriptions.create` is missing. Continue to Task 7, then come back and run all subscription tests together.

- [ ] **Step 5: Commit stub**

```bash
git add convex/subscriptions.ts convex/subscriptions.test.ts
git commit -m "feat: add getAll and getUpcoming subscription queries"
```

---

## Task 7: Subscription Mutations + Pro Queries

**Files:**
- Modify: `convex/subscriptions.ts`

- [ ] **Step 1: Add mutation tests to subscriptions.test.ts**

Append to `convex/subscriptions.test.ts`:

```typescript
test("create inserts a subscription and returns its id", async () => {
  const t = convexTest(schema, modules)
  const id = await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub())
  expect(typeof id).toBe("string")
})

test("update patches subscription fields", async () => {
  const t = convexTest(schema, modules)
  const id = await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ amount: 10 }))
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.update, { id, amount: 20 })
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getAll)
  expect(result.subscriptions[0].amount).toBe(20)
})

test("update rejects another user's subscription", async () => {
  const t = convexTest(schema, modules)
  const id = await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub())
  await expect(
    t.withIdentity(OTHER_IDENTITY).mutation(api.subscriptions.update, { id, amount: 1 })
  ).rejects.toThrow("Not found or unauthorized")
})

test("remove deletes a subscription", async () => {
  const t = convexTest(schema, modules)
  const id = await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub())
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.remove, { id })
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getAll)
  expect(result.subscriptions).toHaveLength(0)
})

test("remove rejects another user's subscription", async () => {
  const t = convexTest(schema, modules)
  const id = await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub())
  await expect(
    t.withIdentity(OTHER_IDENTITY).mutation(api.subscriptions.remove, { id })
  ).rejects.toThrow("Not found or unauthorized")
})

test("getMonthlySummary requires Pro entitlement", async () => {
  const t = convexTest(schema, modules)
  await expect(
    t.withIdentity(IDENTITY).query(api.subscriptions.getMonthlySummary)
  ).rejects.toThrow("Pro subscription required")
})

test("getMonthlySummary returns 7 months of data for Pro user", async () => {
  const t = convexTest(schema, modules)
  // Insert a userBilling record to grant Pro
  await t.run(async (ctx) => {
    await ctx.db.insert("userBilling", {
      tokenIdentifier: "clerk|user_abc",
      clerkSubscriptionId: "sub_test",
      status: "active",
      isProActive: true,
      updatedAt: Date.now(),
    })
  })
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({ amount: 12, billingCycle: "monthly" }))
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getMonthlySummary)
  expect(result).toHaveLength(7)
  result.forEach((m: { month: string; total: number }) => {
    expect(m.month).toMatch(/^\d{4}-\d{2}$/)
    expect(m.total).toBeGreaterThanOrEqual(0)
  })
})

test("getHistory requires Pro entitlement", async () => {
  const t = convexTest(schema, modules)
  await expect(
    t.withIdentity(IDENTITY).query(api.subscriptions.getHistory, {})
  ).rejects.toThrow("Pro subscription required")
})

test("getHistory returns past billing events for Pro user", async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    await ctx.db.insert("userBilling", {
      tokenIdentifier: "clerk|user_abc",
      clerkSubscriptionId: "sub_test",
      status: "active",
      isProActive: true,
      updatedAt: Date.now(),
    })
  })
  // Create a subscription with nextBillingDate 60 days from now (so past dates exist)
  await t.withIdentity(IDENTITY).mutation(api.subscriptions.create, makeSub({
    amount: 10,
    billingCycle: "monthly",
    nextBillingDate: NOW + DAYS(60),
  }))
  const result = await t.withIdentity(IDENTITY).query(api.subscriptions.getHistory, { limit: 5 })
  expect(Array.isArray(result)).toBe(true)
  // Should have at least 1 past event (30 days ago)
  expect(result.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npm run test:convex -- convex/subscriptions.test.ts
```

Expected: multiple FAILs for the new tests — mutations and Pro queries not yet implemented.

- [ ] **Step 3: Add mutations and Pro queries to subscriptions.ts**

Append to `convex/subscriptions.ts` (after `getUpcoming`):

```typescript
export const getMonthlySummary = query({
  args: {},
  handler: async (ctx, _args) => {
    await verifyEntitlement(ctx)
    const identity = await requireAuth(ctx)
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .take(200)

    const now = new Date()
    const months: { month: string; total: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime()

      const total = subs
        .filter(
          (s) =>
            s.status === "active" &&
            (s.startDate == null || s.startDate <= monthEnd)
        )
        .reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0)

      months.push({ month: monthKey, total })
    }

    return months
  },
})

export const getHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await verifyEntitlement(ctx)
    const identity = await requireAuth(ctx)
    const limit = args.limit ?? 20
    const now = Date.now()

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) =>
        q
          .eq("tokenIdentifier", identity.tokenIdentifier)
          .eq("status", "active")
      )
      .take(100)

    const events: {
      name: string
      amount: number
      currency: string
      billingCycle: BillingCycle
      date: number
    }[] = []

    for (const sub of subs) {
      const cycleMs = cycleToDays(sub.billingCycle) * 24 * 60 * 60 * 1000
      let date = sub.nextBillingDate - cycleMs
      for (let i = 0; i < 24 && date > 0; i++) {
        if (date < now) {
          events.push({
            name: sub.name,
            amount: sub.amount,
            currency: sub.currency,
            billingCycle: sub.billingCycle,
            date,
          })
        }
        date -= cycleMs
      }
    }

    events.sort((a, b) => b.date - a.date)
    return events.slice(0, limit)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    currency: v.string(),
    billingCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    startDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    return ctx.db.insert("subscriptions", {
      tokenIdentifier: identity.tokenIdentifier,
      ...args,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingCycle: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
    nextBillingDate: v.optional(v.number()),
    category: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    startDate: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("cancelled")
      )
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const { id, ...fields } = args
    const existing = await ctx.db.get(id)
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Not found or unauthorized")
    }
    await ctx.db.patch(id, fields)
  },
})

export const remove = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx)
    const existing = await ctx.db.get(args.id)
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("Not found or unauthorized")
    }
    await ctx.db.delete(args.id)
  },
})
```

- [ ] **Step 4: Run all subscription tests**

```bash
npm run test:convex -- convex/subscriptions.test.ts
```

Expected: PASS — all tests green, including the `lib.test.ts` tests from Task 4 which can now also run:

```bash
npm run test:convex -- convex/lib.test.ts
```

Expected: PASS — both lib tests green.

- [ ] **Step 5: Commit**

```bash
git add convex/subscriptions.ts convex/subscriptions.test.ts
git commit -m "feat: add subscription queries and mutations (create, update, remove, getMonthlySummary, getHistory)"
```

---

## Task 8: Internal Billing Mutations

**Files:**
- Create: `convex/billing.ts`
- Create: `convex/billing.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// convex/billing.test.ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

test("upsertUserBilling creates a new billing record", async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    // Seed a users record so tokenIdentifier can be resolved
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|user_abc",
      clerkUserId: "user_abc",
      preferredCurrency: "USD",
      notificationsEnabled: false,
      reminderDaysBefore: 3,
    })
  })
  await t.mutation(internal.billing.upsertUserBilling, {
    clerkUserId: "user_abc",
    clerkSubscriptionId: "sub_123",
    status: "active",
  })
  const records = await t.run(async (ctx) => {
    return ctx.db.query("userBilling").collect()
  })
  expect(records).toHaveLength(1)
  expect(records[0].isProActive).toBe(true)
  expect(records[0].tokenIdentifier).toBe("clerk|user_abc")
})

test("upsertUserBilling updates an existing record", async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|user_abc",
      clerkUserId: "user_abc",
      preferredCurrency: "USD",
      notificationsEnabled: false,
      reminderDaysBefore: 3,
    })
  })
  await t.mutation(internal.billing.upsertUserBilling, {
    clerkUserId: "user_abc",
    clerkSubscriptionId: "sub_123",
    status: "active",
  })
  await t.mutation(internal.billing.upsertUserBilling, {
    clerkUserId: "user_abc",
    clerkSubscriptionId: "sub_123",
    status: "past_due",
  })
  const records = await t.run(async (ctx) => {
    return ctx.db.query("userBilling").collect()
  })
  expect(records).toHaveLength(1)
  expect(records[0].status).toBe("past_due")
  expect(records[0].isProActive).toBe(false)
})

test("upsertUserBilling: canceled with future period end is still Pro active", async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: "clerk|user_abc",
      clerkUserId: "user_abc",
      preferredCurrency: "USD",
      notificationsEnabled: false,
      reminderDaysBefore: 3,
    })
  })
  const futureEnd = Date.now() + 30 * 24 * 60 * 60 * 1000
  await t.mutation(internal.billing.upsertUserBilling, {
    clerkUserId: "user_abc",
    clerkSubscriptionId: "sub_123",
    status: "canceled",
    currentPeriodEnd: futureEnd,
    canceledAt: Date.now(),
  })
  const records = await t.run(async (ctx) => {
    return ctx.db.query("userBilling").collect()
  })
  expect(records[0].isProActive).toBe(true)
})

test("logBillingEvent inserts an audit record", async () => {
  const t = convexTest(schema, modules)
  await t.mutation(internal.billing.logBillingEvent, {
    tokenIdentifier: "clerk|user_abc",
    clerkSubscriptionId: "sub_123",
    eventType: "subscription.active",
    status: "active",
    rawData: JSON.stringify({ id: "sub_123" }),
    occurredAt: Date.now(),
  })
  const events = await t.run(async (ctx) => {
    return ctx.db.query("billingEvents").collect()
  })
  expect(events).toHaveLength(1)
  expect(events[0].eventType).toBe("subscription.active")
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:convex -- convex/billing.test.ts
```

Expected: FAIL — `internal.billing` does not exist yet.

- [ ] **Step 3: Implement billing.ts**

```typescript
// convex/billing.ts
import { internalMutation } from "./_generated/server"
import { v } from "convex/values"

export const upsertUserBilling = internalMutation({
  args: {
    clerkUserId: v.string(),
    clerkSubscriptionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("ended")
    ),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Resolve tokenIdentifier from clerkUserId via users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId)
      )
      .unique()
    const tokenIdentifier = user?.tokenIdentifier ?? ""

    const isProActive =
      args.status === "active" ||
      (args.status === "canceled" &&
        args.currentPeriodEnd != null &&
        args.currentPeriodEnd > Date.now())

    const existing = await ctx.db
      .query("userBilling")
      .withIndex("by_clerk_subscription", (q) =>
        q.eq("clerkSubscriptionId", args.clerkSubscriptionId)
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        tokenIdentifier,
        status: args.status,
        isProActive,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("userBilling", {
        tokenIdentifier,
        clerkSubscriptionId: args.clerkSubscriptionId,
        status: args.status,
        isProActive,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        updatedAt: Date.now(),
      })
    }
  },
})

export const logBillingEvent = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    clerkSubscriptionId: v.string(),
    eventType: v.string(),
    status: v.optional(v.string()),
    rawData: v.optional(v.string()),
    occurredAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("billingEvents", args)
  },
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:convex -- convex/billing.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add convex/billing.ts convex/billing.test.ts
git commit -m "feat: add internal billing mutations — upsertUserBilling, logBillingEvent"
```

---

## Task 9: Upgrade Billing Webhook

**Files:**
- Modify: `convex/billingWebhook.ts`

- [ ] **Step 1: Replace billingWebhook.ts with DB-writing version**

The current file only logs. Replace it entirely:

```typescript
// convex/billingWebhook.ts
import { httpActionGeneric as httpAction } from "convex/server"
import { internal } from "./_generated/api"
import { Webhook } from "svix"

type ClerkBillingEventData = {
  id: string
  user_id?: string
  subscription_id?: string
  status?: string
  current_period_end?: number
  canceled_at?: number
}

export const clerkBillingWebhook = httpAction(async (ctx, request) => {
  const body = await request.text()

  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error("[billing] CLERK_WEBHOOK_SECRET is not set")
    return new Response("Server misconfiguration", { status: 500 })
  }

  let event: { type: string; data: ClerkBillingEventData }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: ClerkBillingEventData }
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const data = event.data
  // subscriptionItem events nest the subscription id under subscription_id
  const clerkSubscriptionId = data.subscription_id ?? data.id
  const clerkUserId = data.user_id ?? ""
  const occurredAt = Date.now()

  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
      // No status change to persist yet — log only
      break

    case "subscription.active":
      await ctx.runMutation(internal.billing.upsertUserBilling, {
        clerkUserId,
        clerkSubscriptionId,
        status: "active",
        currentPeriodEnd: data.current_period_end
          ? data.current_period_end * 1000
          : undefined,
      })
      break

    case "subscription.pastDue":
      await ctx.runMutation(internal.billing.upsertUserBilling, {
        clerkUserId,
        clerkSubscriptionId,
        status: "past_due",
      })
      break

    case "subscriptionItem.canceled":
      await ctx.runMutation(internal.billing.upsertUserBilling, {
        clerkUserId,
        clerkSubscriptionId,
        status: "canceled",
        canceledAt: occurredAt,
        currentPeriodEnd: data.current_period_end
          ? data.current_period_end * 1000
          : undefined,
      })
      break

    case "subscriptionItem.ended":
      await ctx.runMutation(internal.billing.upsertUserBilling, {
        clerkUserId,
        clerkSubscriptionId,
        status: "ended",
      })
      break

    default:
      break
  }

  // Always log every event for the audit trail.
  // tokenIdentifier is empty string if no users record exists yet (user signed up
  // but hasn't opened the app). rawData provides enough context to debug manually.
  await ctx.runMutation(internal.billing.logBillingEvent, {
    tokenIdentifier: "",
    clerkSubscriptionId,
    eventType: event.type,
    status: data.status,
    rawData: body,
    occurredAt,
  })

  return new Response(null, { status: 200 })
})
```

> **Note on `current_period_end`:** Clerk may send this as a Unix timestamp in seconds. The `* 1000` conversion above assumes seconds — verify against the actual Clerk webhook payload in the dashboard's "Recent Webhooks" tab once deployed.

> **Note on `user_id` field:** Verify the exact field name from Clerk's webhook payload for each event type in their dashboard. If `user_id` is absent, `clerkUserId` will be `""` and the `users` lookup will return null — the `tokenIdentifier` in `userBilling` will be an empty string until the user opens the app and `ensureUser` is called.

- [ ] **Step 2: Push and verify no TypeScript errors**

```bash
npx convex dev --once
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add convex/billingWebhook.ts
git commit -m "feat: upgrade billing webhook to persist userBilling + billingEvents"
```

---

## Task 10: Full Test Run

- [ ] **Step 1: Run all Convex tests**

```bash
npm run test:convex
```

Expected: all tests pass across `users.test.ts`, `subscriptions.test.ts`, `billing.test.ts`, `lib.test.ts`.

- [ ] **Step 2: Push schema to dev and verify Convex dashboard**

```bash
npx convex dev --once
```

Open the Convex dashboard → Data tab. Verify all 4 tables appear: `subscriptions`, `users`, `userBilling`, `billingEvents`.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "test: verify all Convex schema and function tests pass"
```
