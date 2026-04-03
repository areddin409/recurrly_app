# Recurrly App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Recurrly — a subscription tracker mobile app — from the current Expo scaffold to a deployable app with free tracking and a Pro tier (analytics, insights) gated via Clerk Billing.

**Architecture:** Computed Convex — Convex handles all queries including derived aggregates (monthly summaries, upcoming renewals). Feature gating is enforced at two layers: the client shows a paywall via `use-entitlement.ts`, and Convex functions throw on unpaid access.

**Tech Stack:** Expo 54 · React Native 0.81.5 · React 19 · Expo Router v6 · NativeWind v5 (CSS already configured in `global.css`) · Clerk (`@clerk/clerk-expo`) · Convex · `expo-secure-store`

---

## Current State

- `global.css` — complete NativeWind v5 theme with all component classes (`.auth-*`, `.sub-*`, `.tabs-*`, `.modal-*`, `.home-*`). **Do not modify this file.**
- `app/_layout.tsx` — basic Stack layout, needs Clerk + Convex providers
- `app/index.tsx` — stub, needs splash/redirect logic
- `app/(auth)/sign-in.tsx` + `sign-up.tsx` — stubs, need Clerk implementation
- `app/onboarding.tsx` — delete (replaced by updated `index.tsx`)
- `app/(tabs)/` — does not exist yet, build from scratch
- `components/` — has boilerplate (hello-wave, parallax-scroll-view) to delete

---

## File Structure

**New utilities:**
- `utils/billing.ts` — `toMonthlyAmount()`, `totalMonthlySpend()`, `daysUntil()`, `cycleToDays()`
- `utils/token-cache.ts` — Clerk SecureStore token cache

**Updated constants:**
- `constants/theme.ts` — replace with Recurrly color tokens + accent palette

**New hooks:**
- `hooks/use-entitlement.ts` — wraps Clerk `has()`, returns `{ isPro: boolean }`

**Convex backend:**
- `convex/auth.config.ts` — Clerk JWT domain
- `convex/schema.ts` — subscriptions table + indexes
- `convex/subscriptions.ts` — queries: `getAll`, `getUpcoming`, `getMonthlySummary`, `getHistory`; mutations: `create`, `update`, `remove`

**Updated app routes:**
- `app/_layout.tsx` — add `ClerkProvider → ConvexProviderWithClerk` wrapper
- `app/index.tsx` — splash screen + auth redirect
- `app/(auth)/_layout.tsx` — new: unauthenticated stack
- `app/(auth)/sign-in.tsx` — replace stub with Clerk email/password
- `app/(auth)/sign-up.tsx` — replace stub with Clerk email/password
- `app/(auth)/verify.tsx` — new: email verification code entry

**New tab routes:**
- `app/(tabs)/_layout.tsx` — 4-tab layout
- `app/(tabs)/index.tsx` — Home
- `app/(tabs)/subscriptions.tsx` — My Subscriptions
- `app/(tabs)/insights.tsx` — Monthly Insights (Pro)
- `app/(tabs)/settings.tsx` — Settings
- `app/(tabs)/subscription/add.tsx` — Add subscription modal
- `app/(tabs)/subscription/[id].tsx` — Edit subscription modal

**New shared components:**
- `components/BalanceBanner.tsx` — coral card with monthly total
- `components/UpcomingCard.tsx` — single upcoming renewal card
- `components/SubscriptionRow.tsx` — single subscription list row
- `components/SubscriptionForm.tsx` — add/edit form (shared by both modals)
- `components/PaywallModal.tsx` — full-screen Pro upgrade prompt
- `components/UpsellCard.tsx` — mid-list upgrade card (free users)

**Tests:**
- `__tests__/utils/billing.test.ts`
- `__tests__/components/SubscriptionRow.test.tsx`
- `__tests__/components/SubscriptionForm.test.tsx`

**Config:**
- `.env.local` — `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_CONVEX_URL`, `CLERK_JWT_ISSUER_DOMAIN`

---

## Tasks

### Task 1: Install dependencies + configure testing

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd "d:/Web Dev/2026/recurrly_app"
npx expo install convex @clerk/clerk-expo expo-secure-store
```

- [ ] **Step 2: Install test dependencies**

```bash
npm install --save-dev jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 3: Add jest config to `package.json`**

Add after `"private": true`:

```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|convex)"
  ]
}
```

- [ ] **Step 4: Verify jest runs**

```bash
npx jest --passWithNoTests
# Expected: "Test Suites: 0 skipped, 0 total"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add convex, clerk, and jest dependencies"
```

---

### Task 2: Clean up boilerplate + update theme constants

**Files:**
- Delete: `app/onboarding.tsx`, `components/hello-wave.tsx`, `components/parallax-scroll-view.tsx`
- Modify: `constants/theme.ts`

- [ ] **Step 1: Delete unused files**

```bash
cd "d:/Web Dev/2026/recurrly_app"
rm app/onboarding.tsx components/hello-wave.tsx components/parallax-scroll-view.tsx
```

- [ ] **Step 2: Replace `constants/theme.ts`**

```typescript
export const Colors = {
  cream: "#FFF9E3",
  coral: "#EA7A53",
  navy: "#08121A",
  muted: "#435875",
  accentBlue: "#99B7DD",
  accentYellow: "#F7D44C",
  accentTeal: "#8BCBB8",
  cardBg: "#F6ECC9",
  white: "#FFFFFF",
} as const;

export const ACCENT_PALETTE = [
  "#99B7DD",
  "#F7D44C",
  "#8BCBB8",
] as const;
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove boilerplate, update theme constants"
```

---

### Task 3: Billing utilities (TDD)

**Files:**
- Create: `utils/billing.ts`
- Create: `__tests__/utils/billing.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/utils/billing.test.ts`:

```typescript
import { toMonthlyAmount, totalMonthlySpend, daysUntil, cycleToDays } from "../../utils/billing";

describe("toMonthlyAmount", () => {
  it("returns monthly amount unchanged", () => {
    expect(toMonthlyAmount(10, "monthly")).toBe(10);
  });
  it("multiplies weekly by 4.33", () => {
    expect(toMonthlyAmount(10, "weekly")).toBeCloseTo(43.3, 1);
  });
  it("divides yearly by 12", () => {
    expect(toMonthlyAmount(120, "yearly")).toBeCloseTo(10, 5);
  });
});

describe("totalMonthlySpend", () => {
  it("sums normalized amounts", () => {
    const subs = [
      { amount: 10, billingCycle: "monthly" as const },
      { amount: 120, billingCycle: "yearly" as const },
    ];
    expect(totalMonthlySpend(subs)).toBeCloseTo(20, 5);
  });
  it("returns 0 for empty array", () => {
    expect(totalMonthlySpend([])).toBe(0);
  });
});

describe("daysUntil", () => {
  it("returns 0 for past dates", () => {
    expect(daysUntil(Date.now() - 1000)).toBe(0);
  });
  it("returns correct days for future date", () => {
    const future = Date.now() + 3 * 24 * 60 * 60 * 1000;
    expect(daysUntil(future)).toBe(3);
  });
});

describe("cycleToDays", () => {
  it("returns 7 for weekly", () => expect(cycleToDays("weekly")).toBe(7));
  it("returns 30 for monthly", () => expect(cycleToDays("monthly")).toBe(30));
  it("returns 365 for yearly", () => expect(cycleToDays("yearly")).toBe(365));
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npx jest __tests__/utils/billing.test.ts
# Expected: FAIL — "Cannot find module '../../utils/billing'"
```

- [ ] **Step 3: Create `utils/billing.ts`**

```typescript
export type BillingCycle = "weekly" | "monthly" | "yearly";

export function cycleToDays(cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly": return 7;
    case "monthly": return 30;
    case "yearly": return 365;
  }
}

export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly": return amount * 4.33;
    case "monthly": return amount;
    case "yearly": return amount / 12;
  }
}

export function totalMonthlySpend(
  subscriptions: Array<{ amount: number; billingCycle: BillingCycle }>
): number {
  return subscriptions.reduce(
    (sum, sub) => sum + toMonthlyAmount(sub.amount, sub.billingCycle),
    0
  );
}

export function daysUntil(timestamp: number): number {
  const diff = timestamp - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx jest __tests__/utils/billing.test.ts
# Expected: PASS — 8 tests pass
```

- [ ] **Step 5: Create `utils/token-cache.ts`**

```typescript
import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add utils/ __tests__/
git commit -m "feat: add billing utilities and token cache"
```

---

### Task 4: Convex schema + auth config

**Files:**
- Create: `convex/auth.config.ts`
- Create: `convex/schema.ts`
- Create: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize Convex project**

```bash
cd "d:/Web Dev/2026/recurrly_app"
npx convex dev --once
```

Follow the prompts to create a new project named `recurrly-app`. This generates `convex/_generated/` and populates `CONVEX_DEPLOYMENT` + `EXPO_PUBLIC_CONVEX_URL` in `.env.local`.

- [ ] **Step 2: Add remaining env vars to `.env.local`**

Open `.env.local` and ensure all three are present (fill in your Clerk values from Clerk Dashboard → Configure → JWT Templates → Convex):

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_JWT_ISSUER_DOMAIN=https://YOUR_INSTANCE.clerk.accounts.dev
EXPO_PUBLIC_CONVEX_URL=https://YOUR_DEPLOYMENT.convex.cloud
```

- [ ] **Step 3: Add `.env.local` to `.gitignore`**

Open `.gitignore` and add:

```
.env.local
```

- [ ] **Step 4: Create `convex/auth.config.ts`**

```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
```

- [ ] **Step 5: Create `convex/schema.ts`**

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  subscriptions: defineTable({
    userId: v.string(),
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
});
```

- [ ] **Step 6: Push schema to Convex**

```bash
npx convex dev --once
# Expected: "Schema updated" — no errors
```

- [ ] **Step 7: Commit**

```bash
git add convex/auth.config.ts convex/schema.ts convex/_generated/ .gitignore
git commit -m "feat: add Convex schema and Clerk auth config"
```

---

### Task 5: Convex subscription queries

**Files:**
- Create: `convex/subscriptions.ts`

- [ ] **Step 1: Create `convex/subscriptions.ts` with all queries**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<any> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject as string;
}

function isPro(identity: Record<string, any>): boolean {
  // Clerk Billing sets entitlements in the JWT as a custom claim.
  // Adjust the claim key to match your Clerk Billing plan configuration.
  const entitlements: string[] = identity.entitlements ?? [];
  return entitlements.includes("pro");
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .collect();
  },
});

export const getUpcoming = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    const userId = await requireUser(ctx);
    const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;
    return ctx.db
      .query("subscriptions")
      .withIndex("by_user_next_billing", (q) =>
        q.eq("userId", userId).lte("nextBillingDate", cutoff)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(5);
  },
});

export const getMonthlySummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (!isPro(identity)) throw new Error("Pro subscription required");

    const userId = identity.subject as string;
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .collect();

    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = 0;
    }

    for (const sub of subs) {
      const cycleDays =
        sub.billingCycle === "weekly" ? 7 :
        sub.billingCycle === "monthly" ? 30 : 365;
      const cycleMs = cycleDays * 24 * 60 * 60 * 1000;
      const windowStart = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();

      let date = sub.nextBillingDate;
      while (date > windowStart) {
        date -= cycleMs;
        const d = new Date(date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (months[key] !== undefined) months[key] += sub.amount;
      }
    }

    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return Object.entries(months).map(([month, amount]) => ({
      month,
      amount,
      isCurrent: month === currentKey,
    }));
  },
});

export const getHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    if (!isPro(identity)) throw new Error("Pro subscription required");

    const userId = identity.subject as string;
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .collect();

    const events: Array<{
      name: string;
      amount: number;
      date: number;
      accentColor: string | undefined;
    }> = [];
    const now = Date.now();
    const windowStart = now - 90 * 24 * 60 * 60 * 1000;

    for (const sub of subs) {
      const cycleDays =
        sub.billingCycle === "weekly" ? 7 :
        sub.billingCycle === "monthly" ? 30 : 365;
      const cycleMs = cycleDays * 24 * 60 * 60 * 1000;
      let date = sub.nextBillingDate;
      while (date > windowStart) {
        date -= cycleMs;
        if (date <= now && date > windowStart) {
          events.push({ name: sub.name, amount: sub.amount, date, accentColor: sub.accentColor });
        }
      }
    }

    return events.sort((a, b) => b.date - a.date).slice(0, 10);
  },
});
```

- [ ] **Step 2: Push and verify no TypeScript errors**

```bash
npx convex dev --once
# Expected: "Functions updated" — no errors
```

- [ ] **Step 3: Commit**

```bash
git add convex/subscriptions.ts convex/_generated/
git commit -m "feat: add Convex subscription queries"
```

---

### Task 6: Convex subscription mutations

**Files:**
- Modify: `convex/subscriptions.ts`

- [ ] **Step 1: Append mutations to `convex/subscriptions.ts`**

At the end of the file, after the `getHistory` export, add:

```typescript
const ACCENT_COLORS = ["#99B7DD", "#F7D44C", "#8BCBB8"] as const;

export const create = mutation({
  args: {
    name: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    billingCycle: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextBillingDate: v.number(),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const accentColor = ACCENT_COLORS[existing.length % ACCENT_COLORS.length];
    return ctx.db.insert("subscriptions", {
      userId,
      name: args.name,
      amount: args.amount,
      currency: args.currency ?? "USD",
      billingCycle: args.billingCycle,
      nextBillingDate: args.nextBillingDate,
      category: args.category,
      accentColor,
      status: "active",
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subscriptions"),
    name: v.optional(v.string()),
    amount: v.optional(v.number()),
    billingCycle: v.optional(
      v.union(v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))
    ),
    nextBillingDate: v.optional(v.number()),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("cancelled"))
    ),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUser(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("subscriptions") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const sub = await ctx.db.get(id);
    if (!sub || sub.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
```

- [ ] **Step 2: Push and verify**

```bash
npx convex dev --once
# Expected: "Functions updated" — no errors
```

- [ ] **Step 3: Commit**

```bash
git add convex/subscriptions.ts convex/_generated/
git commit -m "feat: add Convex subscription mutations"
```

---

### Task 7: Root layout + entitlement hook

**Files:**
- Modify: `app/_layout.tsx`
- Create: `hooks/use-entitlement.ts`

- [ ] **Step 1: Replace `app/_layout.tsx`**

```typescript
import "../global.css";
import { useAuth } from "@clerk/clerk-expo";
import { ClerkProvider } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { tokenCache } from "@/utils/token-cache";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

- [ ] **Step 2: Create `hooks/use-entitlement.ts`**

```typescript
import { useAuth } from "@clerk/clerk-expo";

export function useEntitlement() {
  const { has, isLoaded } = useAuth();
  // Clerk Billing: adjust feature key to match your plan
  const isPro = isLoaded ? (has?.({ feature: "pro" }) ?? false) : false;
  return { isPro, isLoaded };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
# Expected: no errors (or only minor type warnings from _generated/)
```

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx hooks/use-entitlement.ts
git commit -m "feat: add Clerk + Convex providers to root layout"
```

---

### Task 8: Splash / landing screen

**Files:**
- Modify: `app/index.tsx`

- [ ] **Step 1: Replace `app/index.tsx`**

```typescript
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-coral">
        <ActivityIndicator color="#FFF9E3" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-coral">
      <View className="flex-1 justify-end px-6 pb-12">
        <View className="mb-8">
          <Text className="text-4xl font-bold text-white leading-tight">
            Gain Financial{"\n"}Clarity
          </Text>
          <Text className="mt-3 text-base text-white/80">
            Track, analyze and cancel with ease
          </Text>
        </View>
        <Pressable
          className="items-center rounded-2xl bg-white py-4"
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text className="text-base font-bold text-navy">Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add splash/landing screen"
```

---

### Task 9: Auth layout + sign-in screen

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Modify: `app/(auth)/sign-in.tsx`

- [ ] **Step 1: Create `app/(auth)/_layout.tsx`**

```typescript
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Replace `app/(auth)/sign-in.tsx`**

```typescript
import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="auth-scroll" contentContainerClassName="auth-content">
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurrly</Text>
                <Text className="auth-wordmark-sub">Subscription Tracker</Text>
              </View>
            </View>
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to continue managing your subscriptions
            </Text>
          </View>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={`auth-input ${error ? "auth-input-error" : ""}`}
                  placeholder="you@example.com"
                  placeholderTextColor="#435875"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className={`auth-input ${error ? "auth-input-error" : ""}`}
                  placeholder="••••••••"
                  placeholderTextColor="#435875"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
              {error ? <Text className="auth-error">{error}</Text> : null}
              <Pressable
                className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                onPress={handleSignIn}
                disabled={loading}
              >
                <Text className="auth-button-text">
                  {loading ? "Signing in…" : "Sign In"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">New to Recurrly?</Text>
            <Pressable onPress={() => router.push("/(auth)/sign-up")}>
              <Text className="auth-link">Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/
git commit -m "feat: add auth layout and sign-in screen"
```

---

### Task 10: Sign-up + email verification screens

**Files:**
- Modify: `app/(auth)/sign-up.tsx`
- Create: `app/(auth)/verify.tsx`

- [ ] **Step 1: Replace `app/(auth)/sign-up.tsx`**

```typescript
import { useSignUp } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignUp() {
  const { signUp, isLoaded } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || loading) return;
    setError("");
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      router.push("/(auth)/verify");
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="auth-scroll" contentContainerClassName="auth-content">
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurrly</Text>
                <Text className="auth-wordmark-sub">Subscription Tracker</Text>
              </View>
            </View>
            <Text className="auth-title">Create account</Text>
            <Text className="auth-subtitle">
              Start tracking your subscriptions for free
            </Text>
          </View>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className={`auth-input ${error ? "auth-input-error" : ""}`}
                  placeholder="you@example.com"
                  placeholderTextColor="#435875"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className={`auth-input ${error ? "auth-input-error" : ""}`}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#435875"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </View>
              {error ? <Text className="auth-error">{error}</Text> : null}
              <Pressable
                className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text className="auth-button-text">
                  {loading ? "Creating account…" : "Create Account"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Pressable onPress={() => router.back()}>
              <Text className="auth-link">Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create `app/(auth)/verify.tsx`**

```typescript
import { useSignUp } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Verify() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!isLoaded || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <View className="auth-content">
        <Text className="auth-title">Check your email</Text>
        <Text className="auth-subtitle">
          We sent a 6-digit code to your email address
        </Text>

        <View className="auth-card">
          <View className="auth-form">
            <View className="auth-field">
              <Text className="auth-label">Verification code</Text>
              <TextInput
                className={`auth-input ${error ? "auth-input-error" : ""}`}
                placeholder="123456"
                placeholderTextColor="#435875"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text className="auth-button-text">
                {loading ? "Verifying…" : "Verify Email"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/sign-up.tsx" "app/(auth)/verify.tsx"
git commit -m "feat: add sign-up and email verification screens"
```

---

### Task 11: Tab bar layout

**Files:**
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create `app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
}: {
  name: IconName;
  focused: boolean;
}) {
  return (
    <View className={`tabs-pill ${focused ? "tabs-active" : ""}`}>
      <Ionicons
        name={name}
        size={24}
        color={focused ? "#FFF9E3" : "#435875"}
        className="tabs-glyph"
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#08121A",
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="wallet-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart-outline" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings-outline" focused={focused} />
          ),
        }}
      />
      {/* Hide modal routes from tab bar */}
      <Tabs.Screen name="subscription/add" options={{ href: null }} />
      <Tabs.Screen name="subscription/[id]" options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create placeholder screens so the tab bar renders**

```bash
mkdir -p "d:/Web Dev/2026/recurrly_app/app/(tabs)/subscription"
```

Create `app/(tabs)/index.tsx` (temporary placeholder):

```typescript
import { View, Text } from "react-native";
export default function Home() {
  return <View className="flex-1 bg-cream"><Text>Home</Text></View>;
}
```

Create `app/(tabs)/subscriptions.tsx`:

```typescript
import { View, Text } from "react-native";
export default function Subscriptions() {
  return <View className="flex-1 bg-cream"><Text>Subscriptions</Text></View>;
}
```

Create `app/(tabs)/insights.tsx`:

```typescript
import { View, Text } from "react-native";
export default function Insights() {
  return <View className="flex-1 bg-cream"><Text>Insights</Text></View>;
}
```

Create `app/(tabs)/settings.tsx`:

```typescript
import { View, Text } from "react-native";
export default function Settings() {
  return <View className="flex-1 bg-cream"><Text>Settings</Text></View>;
}
```

Create `app/(tabs)/subscription/add.tsx`:

```typescript
import { View, Text } from "react-native";
export default function AddSubscription() {
  return <View className="flex-1 bg-cream"><Text>Add</Text></View>;
}
```

Create `app/(tabs)/subscription/[id].tsx`:

```typescript
import { View, Text } from "react-native";
export default function EditSubscription() {
  return <View className="flex-1 bg-cream"><Text>Edit</Text></View>;
}
```

- [ ] **Step 3: Start the app and confirm the tab bar renders with 4 tabs**

```bash
npx expo start --ios
# Expected: app launches, 4-tab navy bar visible, tabs navigate between placeholder screens
# Ctrl+C to stop
```

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/"
git commit -m "feat: add tab bar layout with placeholder screens"
```

---

### Task 12: BalanceBanner + UpcomingCard components

**Files:**
- Create: `components/BalanceBanner.tsx`
- Create: `components/UpcomingCard.tsx`

- [ ] **Step 1: Create `components/BalanceBanner.tsx`**

```typescript
import { Text, View } from "react-native";

interface Props {
  totalMonthly: number;
  userName: string;
  onAddPress: () => void;
}

export function BalanceBanner({ totalMonthly, userName, onAddPress }: Props) {
  const month = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <View className="home-balance-card">
      <Text className="home-balance-label">Monthly Balance</Text>
      <View className="home-balance-row">
        <Text className="home-balance-amount">
          ${totalMonthly.toFixed(2)}
        </Text>
        <Text className="home-balance-date">{month}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Create `components/UpcomingCard.tsx`**

```typescript
import { Text, View } from "react-native";
import { daysUntil } from "@/utils/billing";

interface Props {
  name: string;
  amount: number;
  nextBillingDate: number;
  accentColor?: string;
}

export function UpcomingCard({ name, amount, nextBillingDate, accentColor }: Props) {
  const days = daysUntil(nextBillingDate);
  const daysLabel = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d left`;

  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <View
          className="upcoming-icon rounded-2xl"
          style={{ backgroundColor: accentColor ?? "#99B7DD" }}
        />
        <Text className="upcoming-price">${amount.toFixed(2)}</Text>
      </View>
      <Text className="upcoming-name">{name}</Text>
      <Text className="upcoming-meta">{daysLabel}</Text>
    </View>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BalanceBanner.tsx components/UpcomingCard.tsx
git commit -m "feat: add BalanceBanner and UpcomingCard components"
```

---

### Task 13: SubscriptionRow component (TDD)

**Files:**
- Create: `components/SubscriptionRow.tsx`
- Create: `__tests__/components/SubscriptionRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/SubscriptionRow.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react-native";
import { SubscriptionRow } from "../../components/SubscriptionRow";

const baseSub = {
  _id: "sub1" as any,
  _creationTime: 0,
  userId: "user1",
  name: "Netflix",
  amount: 15.99,
  currency: "USD",
  billingCycle: "monthly" as const,
  nextBillingDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
  status: "active" as const,
  accentColor: "#99B7DD",
};

describe("SubscriptionRow", () => {
  it("displays the subscription name", () => {
    render(<SubscriptionRow sub={baseSub} onPress={() => {}} />);
    expect(screen.getByText("Netflix")).toBeTruthy();
  });

  it("displays the formatted amount", () => {
    render(<SubscriptionRow sub={baseSub} onPress={() => {}} />);
    expect(screen.getByText("$15.99")).toBeTruthy();
  });

  it("displays the billing cycle", () => {
    render(<SubscriptionRow sub={baseSub} onPress={() => {}} />);
    expect(screen.getByText("monthly")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npx jest __tests__/components/SubscriptionRow.test.tsx
# Expected: FAIL — "Cannot find module '../../components/SubscriptionRow'"
```

- [ ] **Step 3: Create `components/SubscriptionRow.tsx`**

```typescript
import { Pressable, Text, View } from "react-native";
import type { Doc } from "@/convex/_generated/dataModel";

interface Props {
  sub: Doc<"subscriptions">;
  onPress: () => void;
}

export function SubscriptionRow({ sub, onPress }: Props) {
  return (
    <Pressable className="sub-card mb-3" onPress={onPress}>
      <View className="sub-head">
        <View className="sub-main">
          <View
            className="sub-icon"
            style={{ backgroundColor: sub.accentColor ?? "#99B7DD" }}
          />
          <View className="sub-copy">
            <Text className="sub-title">{sub.name}</Text>
            <Text className="sub-meta">
              {sub.billingCycle}
              {sub.category ? ` · ${sub.category}` : ""}
            </Text>
          </View>
        </View>
        <View className="sub-price-box">
          <Text className="sub-price">${sub.amount.toFixed(2)}</Text>
          <Text className="sub-billing">{sub.billingCycle}</Text>
        </View>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx jest __tests__/components/SubscriptionRow.test.tsx
# Expected: PASS — 3 tests pass
```

- [ ] **Step 5: Commit**

```bash
git add components/SubscriptionRow.tsx __tests__/components/SubscriptionRow.test.tsx
git commit -m "feat: add SubscriptionRow component with tests"
```

---

### Task 14: Home screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Replace the placeholder `app/(tabs)/index.tsx`**

```typescript
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { FlatList, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { BalanceBanner } from "@/components/BalanceBanner";
import { UpcomingCard } from "@/components/UpcomingCard";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { totalMonthlySpend } from "@/utils/billing";
import { useUser } from "@clerk/clerk-expo";

export default function Home() {
  const { user } = useUser();
  const allSubs = useQuery(api.subscriptions.getAll) ?? [];
  const upcoming = useQuery(api.subscriptions.getUpcoming, { days: 30 }) ?? [];
  const monthlyTotal = totalMonthlySpend(
    allSubs.map((s) => ({ amount: s.amount, billingCycle: s.billingCycle }))
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Header row */}
        <View className="home-header mt-4">
          <View className="home-user">
            <Text className="home-user-name">
              Hi, {user?.firstName ?? "there"} 👋
            </Text>
          </View>
          <Pressable
            className="home-add-icon items-center justify-center rounded-full bg-primary"
            onPress={() => router.push("/(tabs)/subscription/add")}
          >
            <Text className="text-2xl font-bold text-background">+</Text>
          </Pressable>
        </View>

        {/* Balance banner */}
        <BalanceBanner
          totalMonthly={monthlyTotal}
          userName={user?.firstName ?? ""}
          onAddPress={() => router.push("/(tabs)/subscription/add")}
        />

        {/* Upcoming section */}
        {upcoming.length > 0 && (
          <View className="mt-5">
            <View className="list-head">
              <Text className="list-title">Upcoming</Text>
              <Pressable
                className="list-action"
                onPress={() => router.push("/(tabs)/subscriptions")}
              >
                <Text className="list-action-text">View All</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcoming.map((sub) => (
                <UpcomingCard
                  key={sub._id}
                  name={sub.name}
                  amount={sub.amount}
                  nextBillingDate={sub.nextBillingDate}
                  accentColor={sub.accentColor}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* All subscriptions */}
        <View className="mt-5 mb-8">
          <View className="list-head">
            <Text className="list-title">All Subscriptions</Text>
            <Pressable
              className="list-action"
              onPress={() => router.push("/(tabs)/subscriptions")}
            >
              <Text className="list-action-text">View All</Text>
            </Pressable>
          </View>
          {allSubs.length === 0 ? (
            <Text className="home-empty-state">
              No subscriptions yet — tap + to add one
            </Text>
          ) : (
            allSubs.map((sub) => (
              <SubscriptionRow
                key={sub._id}
                sub={sub}
                onPress={() => router.push(`/(tabs)/subscription/${sub._id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Verify the Home screen renders in the simulator**

```bash
npx expo start --ios
# Expected: Home tab shows balance banner, upcoming scroll, subscription list
# Ctrl+C when verified
```

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: implement Home screen"
```

---

### Task 15: SubscriptionForm component (TDD)

**Files:**
- Create: `components/SubscriptionForm.tsx`
- Create: `__tests__/components/SubscriptionForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/SubscriptionForm.test.tsx`:

```typescript
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SubscriptionForm } from "../../components/SubscriptionForm";

const defaults = {
  name: "",
  amount: "",
  billingCycle: "monthly" as const,
  nextBillingDate: new Date(),
  category: "",
  notes: "",
};

describe("SubscriptionForm", () => {
  it("calls onSubmit with correct data when form is valid", () => {
    const onSubmit = jest.fn();
    render(
      <SubscriptionForm
        initialValues={defaults}
        onSubmit={onSubmit}
        submitLabel="Save"
      />
    );
    fireEvent.changeText(screen.getByPlaceholderText("Netflix, Spotify…"), "Netflix");
    fireEvent.changeText(screen.getByPlaceholderText("9.99"), "15.99");
    fireEvent.press(screen.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Netflix",
        amount: 15.99,
        billingCycle: "monthly",
      })
    );
  });

  it("does not call onSubmit when name is empty", () => {
    const onSubmit = jest.fn();
    render(
      <SubscriptionForm
        initialValues={defaults}
        onSubmit={onSubmit}
        submitLabel="Save"
      />
    );
    fireEvent.press(screen.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when amount is invalid", () => {
    const onSubmit = jest.fn();
    render(
      <SubscriptionForm
        initialValues={defaults}
        onSubmit={onSubmit}
        submitLabel="Save"
      />
    );
    fireEvent.changeText(screen.getByPlaceholderText("Netflix, Spotify…"), "Netflix");
    fireEvent.changeText(screen.getByPlaceholderText("9.99"), "abc");
    fireEvent.press(screen.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npx jest __tests__/components/SubscriptionForm.test.tsx
# Expected: FAIL — "Cannot find module '../../components/SubscriptionForm'"
```

- [ ] **Step 3: Create `components/SubscriptionForm.tsx`**

```typescript
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

const BILLING_CYCLES = ["weekly", "monthly", "yearly"] as const;
type BillingCycle = typeof BILLING_CYCLES[number];

const CATEGORIES = [
  "Entertainment", "Productivity", "Health", "Finance",
  "Education", "Shopping", "Other",
];

export interface FormValues {
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: Date;
  category: string;
  notes: string;
}

interface InitialValues {
  name: string;
  amount: string;
  billingCycle: BillingCycle;
  nextBillingDate: Date;
  category: string;
  notes: string;
}

interface Props {
  initialValues: InitialValues;
  onSubmit: (values: FormValues) => void;
  submitLabel: string;
  loading?: boolean;
}

export function SubscriptionForm({ initialValues, onSubmit, submitLabel, loading }: Props) {
  const [name, setName] = useState(initialValues.name);
  const [amount, setAmount] = useState(initialValues.amount);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialValues.billingCycle);
  const [category, setCategory] = useState(initialValues.category);
  const [notes, setNotes] = useState(initialValues.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      amount: parseFloat(amount),
      billingCycle,
      nextBillingDate: new Date(),
      category: category.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <ScrollView className="modal-body" showsVerticalScrollIndicator={false}>
      {/* Name */}
      <View className="auth-field">
        <Text className="auth-label">Name</Text>
        <TextInput
          className={`auth-input ${errors.name ? "auth-input-error" : ""}`}
          placeholder="Netflix, Spotify…"
          placeholderTextColor="#435875"
          value={name}
          onChangeText={setName}
        />
        {errors.name ? <Text className="auth-error">{errors.name}</Text> : null}
      </View>

      {/* Amount */}
      <View className="auth-field">
        <Text className="auth-label">Amount</Text>
        <TextInput
          className={`auth-input ${errors.amount ? "auth-input-error" : ""}`}
          placeholder="9.99"
          placeholderTextColor="#435875"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        {errors.amount ? <Text className="auth-error">{errors.amount}</Text> : null}
      </View>

      {/* Billing cycle */}
      <View className="auth-field">
        <Text className="auth-label">Billing Cycle</Text>
        <View className="picker-row">
          {BILLING_CYCLES.map((cycle) => (
            <Pressable
              key={cycle}
              className={`picker-option ${billingCycle === cycle ? "picker-option-active" : ""}`}
              onPress={() => setBillingCycle(cycle)}
            >
              <Text
                className={`picker-option-text ${billingCycle === cycle ? "picker-option-text-active" : ""}`}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Category */}
      <View className="auth-field">
        <Text className="auth-label">Category (optional)</Text>
        <View className="category-scroll">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              className={`category-chip ${category === cat ? "category-chip-active" : ""}`}
              onPress={() => setCategory(category === cat ? "" : cat)}
            >
              <Text
                className={`category-chip-text ${category === cat ? "category-chip-text-active" : ""}`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View className="auth-field">
        <Text className="auth-label">Notes (optional)</Text>
        <TextInput
          className="auth-input"
          placeholder="Family plan, shared with…"
          placeholderTextColor="#435875"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />
      </View>

      <Pressable
        className={`auth-button mt-4 ${loading ? "auth-button-disabled" : ""}`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="auth-button-text">
          {loading ? "Saving…" : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
npx jest __tests__/components/SubscriptionForm.test.tsx
# Expected: PASS — 3 tests pass
```

- [ ] **Step 5: Run all tests**

```bash
npx jest
# Expected: PASS — all tests pass
```

- [ ] **Step 6: Commit**

```bash
git add components/SubscriptionForm.tsx __tests__/components/SubscriptionForm.test.tsx
git commit -m "feat: add SubscriptionForm component with tests"
```

---

### Task 16: Add + Edit subscription modals

**Files:**
- Modify: `app/(tabs)/subscription/add.tsx`
- Modify: `app/(tabs)/subscription/[id].tsx`

- [ ] **Step 1: Replace `app/(tabs)/subscription/add.tsx`**

```typescript
import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { SubscriptionForm, type FormValues } from "@/components/SubscriptionForm";

export default function AddSubscription() {
  const createSub = useMutation(api.subscriptions.create);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await createSub({
        name: values.name,
        amount: values.amount,
        billingCycle: values.billingCycle,
        nextBillingDate: values.nextBillingDate.getTime(),
        category: values.category || undefined,
        notes: values.notes || undefined,
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="modal-header">
        <Text className="modal-title">Add Subscription</Text>
        <Pressable className="modal-close" onPress={() => router.back()}>
          <Text className="modal-close-text">✕</Text>
        </Pressable>
      </View>
      <SubscriptionForm
        initialValues={{
          name: "",
          amount: "",
          billingCycle: "monthly",
          nextBillingDate: new Date(),
          category: "",
          notes: "",
        }}
        onSubmit={handleSubmit}
        submitLabel="Add Subscription"
        loading={loading}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Replace `app/(tabs)/subscription/[id].tsx`**

```typescript
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SubscriptionForm, type FormValues } from "@/components/SubscriptionForm";

export default function EditSubscription() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // Reuse getAll and find client-side — avoids adding a getById query for v1.
  // If the subscription list grows large, add a getById query in convex/subscriptions.ts.
  const sub = useQuery(api.subscriptions.getAll)?.find((s) => s._id === id);
  const updateSub = useMutation(api.subscriptions.update);
  const removeSub = useMutation(api.subscriptions.remove);
  const [loading, setLoading] = useState(false);

  if (!sub) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted">Loading…</Text>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      await updateSub({
        id: id as Id<"subscriptions">,
        name: values.name,
        amount: values.amount,
        billingCycle: values.billingCycle,
        nextBillingDate: values.nextBillingDate.getTime(),
        category: values.category || undefined,
        notes: values.notes || undefined,
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await removeSub({ id: id as Id<"subscriptions"> });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="modal-header">
        <Text className="modal-title">Edit Subscription</Text>
        <Pressable className="modal-close" onPress={() => router.back()}>
          <Text className="modal-close-text">✕</Text>
        </Pressable>
      </View>
      <SubscriptionForm
        initialValues={{
          name: sub.name,
          amount: String(sub.amount),
          billingCycle: sub.billingCycle,
          nextBillingDate: new Date(sub.nextBillingDate),
          category: sub.category ?? "",
          notes: sub.notes ?? "",
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        loading={loading}
      />
      <View className="px-5 pb-8">
        <Pressable className="sub-cancel" onPress={handleDelete}>
          <Text className="sub-cancel-text">Delete Subscription</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/subscription/"
git commit -m "feat: add Add and Edit subscription modals"
```

---

### Task 17: UpsellCard + Subscriptions screen

**Files:**
- Create: `components/UpsellCard.tsx`
- Modify: `app/(tabs)/subscriptions.tsx`

- [ ] **Step 1: Create `components/UpsellCard.tsx`**

```typescript
import { Pressable, Text, View } from "react-native";
import { useWebBrowser } from "expo-web-browser";

const UPGRADE_URL = "https://recurrly.com/upgrade"; // Replace with Clerk Billing URL

interface Props {
  onUpgrade: () => void;
}

export function UpsellCard({ onUpgrade }: Props) {
  return (
    <View
      className="sub-card sub-card-expanded mb-3 p-5"
      style={{ backgroundColor: "#8BCBB8" }}
    >
      <Text className="text-lg font-bold text-navy mb-1">
        Unlock Monthly Insights
      </Text>
      <Text className="text-sm text-navy/70 mb-4">
        See spending trends, export your data, and get multi-currency support.
      </Text>
      <Pressable
        className="items-center rounded-2xl bg-navy py-3"
        onPress={onUpgrade}
      >
        <Text className="font-bold text-background">Upgrade to Pro</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Replace `app/(tabs)/subscriptions.tsx`**

```typescript
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/convex/_generated/api";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { UpsellCard } from "@/components/UpsellCard";
import { useEntitlement } from "@/hooks/use-entitlement";

const CLERK_BILLING_URL = "https://recurrly.com/upgrade"; // Replace with actual Clerk Billing URL

export default function Subscriptions() {
  const allSubs = useQuery(api.subscriptions.getAll) ?? [];
  const { isPro } = useEntitlement();

  const handleUpgrade = async () => {
    await WebBrowser.openBrowserAsync(CLERK_BILLING_URL);
  };

  // Insert upsell card after the 3rd item for free users
  const insertUpsellAfter = 2;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="modal-header border-b-0 px-5 pt-4">
        <Text className="modal-title text-2xl">My Subscriptions</Text>
        <Pressable
          className="items-center justify-center rounded-full bg-primary p-2"
          onPress={() => router.push("/(tabs)/subscription/add")}
        >
          <Text className="text-lg font-bold text-background">+</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-4 mb-8">
          {allSubs.length === 0 ? (
            <Text className="home-empty-state">
              No subscriptions yet — tap + to add one
            </Text>
          ) : (
            allSubs.map((sub, index) => (
              <View key={sub._id}>
                <SubscriptionRow
                  sub={sub}
                  onPress={() => router.push(`/(tabs)/subscription/${sub._id}`)}
                />
                {!isPro && index === insertUpsellAfter && (
                  <UpsellCard onUpgrade={handleUpgrade} />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/UpsellCard.tsx "app/(tabs)/subscriptions.tsx"
git commit -m "feat: add Subscriptions screen with upsell card"
```

---

### Task 18: Settings screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace `app/(tabs)/settings.tsx`**

```typescript
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useEntitlement } from "@/hooks/use-entitlement";

const CLERK_BILLING_URL = "https://recurrly.com/upgrade"; // Replace with actual Clerk Billing URL

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { isPro } = useEntitlement();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleUpgrade = async () => {
    await WebBrowser.openBrowserAsync(CLERK_BILLING_URL);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5">
        <Text className="mt-6 mb-4 text-2xl font-bold text-primary">Settings</Text>

        {/* Account */}
        <View className="auth-card mb-4">
          <Text className="auth-label mb-3">Account</Text>
          <View className="flex-row items-center gap-3">
            <View className="size-12 items-center justify-center rounded-full bg-accent">
              <Text className="text-lg font-bold text-background">
                {user?.firstName?.[0] ?? "?"}
              </Text>
            </View>
            <View>
              <Text className="font-bold text-primary">
                {user?.fullName ?? user?.emailAddresses[0]?.emailAddress}
              </Text>
              <Text className="text-sm text-muted">
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Subscription status */}
        <View className="auth-card mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="auth-label">Plan</Text>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: isPro ? "#8BCBB8" : "#F6ECC9" }}
            >
              <Text className="text-xs font-bold text-navy">
                {isPro ? "Pro" : "Free"}
              </Text>
            </View>
          </View>
          {!isPro && (
            <Pressable className="auth-button mt-3" onPress={handleUpgrade}>
              <Text className="auth-button-text">Upgrade to Pro</Text>
            </Pressable>
          )}
        </View>

        {/* Notifications placeholder */}
        <View className="auth-card mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-primary">Notifications</Text>
              <Text className="text-sm text-muted">Coming soon</Text>
            </View>
            <View className="rounded-full bg-muted px-3 py-1">
              <Text className="text-xs font-bold text-muted-foreground">Soon</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          className="mb-8 items-center rounded-2xl border border-destructive/30 bg-destructive/10 py-4"
          onPress={handleSignOut}
        >
          <Text className="font-semibold text-destructive">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/settings.tsx"
git commit -m "feat: add Settings screen"
```

---

### Task 19: PaywallModal + Monthly Insights screen

**Files:**
- Create: `components/PaywallModal.tsx`
- Modify: `app/(tabs)/insights.tsx`

- [ ] **Step 1: Create `components/PaywallModal.tsx`**

```typescript
import { Modal, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";

const CLERK_BILLING_URL = "https://recurrly.com/upgrade"; // Replace with actual Clerk Billing URL

const PRO_FEATURES = [
  "Monthly spending bar chart",
  "Billing history (last 90 days)",
  "Export to CSV / JSON",
  "Multi-currency display",
];

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function PaywallModal({ visible, onDismiss }: Props) {
  const handleUpgrade = async () => {
    onDismiss();
    await WebBrowser.openBrowserAsync(CLERK_BILLING_URL);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="modal-overlay">
        <View className="modal-container p-6">
          <View className="modal-header border-b-0 px-0 pb-4">
            <Text className="modal-title text-2xl">Upgrade to Pro</Text>
            <Pressable className="modal-close" onPress={onDismiss}>
              <Text className="modal-close-text">✕</Text>
            </Pressable>
          </View>

          <Text className="mb-5 text-base text-muted">
            Get deeper insights into your spending with Recurrly Pro.
          </Text>

          <View className="mb-6 gap-3">
            {PRO_FEATURES.map((feature) => (
              <View key={feature} className="flex-row items-center gap-3">
                <View className="size-6 items-center justify-center rounded-full bg-accent">
                  <Text className="text-xs font-bold text-background">✓</Text>
                </View>
                <Text className="text-base text-primary">{feature}</Text>
              </View>
            ))}
          </View>

          <Pressable className="auth-button" onPress={handleUpgrade}>
            <Text className="auth-button-text">Upgrade Now</Text>
          </Pressable>
          <Pressable className="mt-3 items-center py-2" onPress={onDismiss}>
            <Text className="text-sm text-muted">Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Replace `app/(tabs)/insights.tsx`**

```typescript
import { useQuery } from "convex/react";
import { useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { api } from "@/convex/_generated/api";
import { PaywallModal } from "@/components/PaywallModal";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { useEntitlement } from "@/hooks/use-entitlement";
import { useQuery as useConvexQuery } from "convex/react";

export default function Insights() {
  const { isPro, isLoaded } = useEntitlement();
  const [paywallVisible, setPaywallVisible] = useState(!isPro && isLoaded);

  // Only fetch if Pro — Convex will throw otherwise, so skip the call
  const summary = useConvexQuery(
    api.subscriptions.getMonthlySummary,
    isPro ? {} : "skip"
  );
  const history = useConvexQuery(
    api.subscriptions.getHistory,
    isPro ? {} : "skip"
  );
  const upcoming = useConvexQuery(api.subscriptions.getUpcoming, { days: 30 });

  if (!isLoaded) {
    return <SafeAreaView className="flex-1 bg-background" />;
  }

  if (!isPro) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <PaywallModal
          visible={paywallVisible}
          onDismiss={() => setPaywallVisible(false)}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-primary text-center mb-2">
            Monthly Insights
          </Text>
          <Text className="text-center text-muted mb-6">
            Upgrade to Pro to see your spending trends and history.
          </Text>
          <Text
            className="text-accent font-semibold"
            onPress={() => setPaywallVisible(true)}
          >
            Learn more about Pro →
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxAmount = Math.max(...(summary ?? []).map((m) => m.amount), 1);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text className="mt-6 mb-4 text-2xl font-bold text-primary">Monthly Insights</Text>

        {/* Bar chart */}
        {summary && (
          <View className="rounded-3xl bg-card-bg p-5 mb-5">
            <Text className="text-base font-semibold text-primary mb-4">
              Spending (last 7 months)
            </Text>
            <View className="flex-row items-end gap-2 h-40">
              {summary.map((item) => {
                const barHeight = Math.max((item.amount / maxAmount) * 130, 4);
                const label = item.month.slice(5); // "MM"
                return (
                  <View key={item.month} className="flex-1 items-center gap-1">
                    <View
                      className="w-full rounded-t-lg"
                      style={{
                        height: barHeight,
                        backgroundColor: item.isCurrent ? "#EA7A53" : "#08121A",
                      }}
                    />
                    <Text className="text-xs text-muted">{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming */}
        {upcoming && upcoming.length > 0 && (
          <View className="mb-5">
            <Text className="list-title mb-3">Next Renewal</Text>
            <SubscriptionRow
              sub={upcoming[0] as any}
              onPress={() => {}}
            />
          </View>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <View className="mb-8">
            <Text className="list-title mb-3">History</Text>
            {history.map((event, i) => (
              <View
                key={i}
                className="flex-row items-center justify-between py-3 border-b border-border"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="size-10 rounded-lg"
                    style={{ backgroundColor: event.accentColor ?? "#99B7DD" }}
                  />
                  <View>
                    <Text className="font-semibold text-primary">{event.name}</Text>
                    <Text className="text-sm text-muted">
                      {new Date(event.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text className="font-bold text-primary">${event.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/PaywallModal.tsx "app/(tabs)/insights.tsx"
git commit -m "feat: add PaywallModal and Monthly Insights screen"
```

---

### Task 20: End-to-end smoke test + final cleanup

- [ ] **Step 1: Run all tests**

```bash
npx jest
# Expected: all tests pass
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
# Expected: no errors
```

- [ ] **Step 3: Start app and manually verify each screen**

```bash
npx expo start --ios
```

Walk through:
- [ ] Splash screen shows "Gain Financial Clarity" on coral background
- [ ] Tapping Get Started → sign-in screen
- [ ] Sign up creates account, email verification works, lands on Home
- [ ] Home shows balance banner (coral), upcoming section, subscription list
- [ ] Tapping + → Add Subscription modal, fill form, subscription appears in list
- [ ] Tapping a subscription → Edit modal, can update or delete
- [ ] Subscriptions tab shows full list, upsell card visible for free users
- [ ] Insights tab → paywall modal appears for free users
- [ ] Settings tab → account info, upgrade CTA, sign out works

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final smoke test and cleanup"
```

---

## Post-Build Checklist

Before App Store / Play Store submission:

- [ ] Replace `CLERK_BILLING_URL` placeholder in `UpsellCard.tsx`, `PaywallModal.tsx`, `settings.tsx` with actual Clerk Billing hosted page URL
- [ ] Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard environment variables (Settings → Environment Variables)
- [ ] Configure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` for production Clerk app
- [ ] Set `app.json` `slug` and `bundleIdentifier` / `package` for store submission
- [ ] Test push notification token handling (deferred feature — see spec)
- [ ] Verify Clerk Billing entitlement claim key matches `isPro()` check in `convex/subscriptions.ts`
