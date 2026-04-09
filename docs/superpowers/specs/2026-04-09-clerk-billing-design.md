# Clerk Billing — Design Spec
**Date:** 2026-04-09
**Scope:** PaywallModal component + Convex webhook handler + Clerk Dashboard setup

---

## Overview

Recurrly monetizes via a Pro tier gated through Clerk Billing. Free users get full subscription tracking. Pro unlocks Monthly Insights, spending history, export, and multi-currency display.

Billing is web-only (no in-app purchase, no App Store/Play Store cut). The checkout flow opens Clerk's hosted checkout page in `expo-web-browser`. Entitlement is checked client-side via `useAuth().has({ feature: "pro" })` and enforced server-side in Convex via `verifyEntitlement(ctx)`.

**Approach:** Clerk-native — plan selection happens on Clerk's hosted checkout page. PaywallModal shows features + static pricing, then hands off to Clerk for the actual purchase.

---

## Clerk Dashboard Configuration (manual, pre-code)

Steps performed once in the Clerk Dashboard before any code ships:

1. **Connect Stripe** — Dashboard → Billing → Stripe → connect account
2. **Create Pro plan** — Dashboard → Billing → Subscription plans:
   - Monthly price: **$4.99/month**
   - Annual price: **$39.99/year** (~33% off)
3. **Add feature** — add a feature named exactly `pro` to the plan (this is what `has({ feature: "pro" })` checks)
4. **Register webhook** — point at the Convex HTTP action URL (`https://<your-convex-deployment>.convex.site/webhooks/clerk-billing`), subscribe to:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.deleted`
5. **Collect values** for env vars:
   - Hosted checkout URL → `EXPO_PUBLIC_CLERK_CHECKOUT_URL` (in `.env.local`)
   - Webhook signing secret → `CLERK_WEBHOOK_SECRET` (in Convex dashboard env vars)

---

## New Files

- `components/PaywallModal.tsx` — full-screen upgrade modal
- `convex/http.ts` — HTTP router with webhook handler

## Dependencies

`expo-web-browser` (`~15.0.10`) is **already installed** in the project. No new packages needed on the Expo side. `svix` must be added as a Convex dependency (npm package, installed in the project root — Convex bundles it with the function).

---

## PaywallModal (`components/PaywallModal.tsx`)

### Props

```tsx
type PaywallModalProps = {
  visible: boolean
  onDismiss: () => void
}
```

### Layout

```
Modal (full-screen, slide animation)
├── Close button (×) — top-right, absolute position
├── Header area (coral bg, #EA7A53)
│   ├── "Recurrly Pro" — large bold title, cream text
│   └── "Unlock everything" — subtitle, cream/80 opacity
├── Feature list (cream bg, navy text)
│   ├── ✓ Monthly Insights & spending trends
│   ├── ✓ Full spending history
│   ├── ✓ Export to CSV / JSON
│   └── ✓ Multi-currency display
├── Pricing block
│   └── "$4.99/month or $39.99/year" — static display text
├── "Upgrade Now" CTA — coral, full-width, rounded-2xl
└── "Maybe later" — text link, muted, dismisses modal
```

### Behavior

- "Upgrade Now" →
  1. `await WebBrowser.openBrowserAsync(process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL!)`
  2. After the browser closes (awaited), call `await clerk.session?.reload()` to force a token refresh so entitlement changes take effect immediately without requiring an app restart
- "Maybe later" / close (×) → calls `onDismiss`
- Modal is **controlled** — parent manages `visible` state

**Note on checkout URL:** `EXPO_PUBLIC_CLERK_CHECKOUT_URL` is the static hosted checkout URL from the Clerk Dashboard plan page. Clerk's hosted checkout handles its own authentication via the active session cookie — no user-specific token or email query param is required. Verify this holds in your Clerk instance before shipping; if Clerk requires a session-aware URL, use `clerk.__experimental_checkout?.url({ planId })` instead and update this spec.

### Colors

Uses existing Recurrly tokens from `constants/theme.ts`:
- Header bg: `colors.accent` (`#EA7A53`)
- Body bg: `colors.background` (`#FFF9E3`)
- CTA bg: `colors.accent`
- Text: `colors.primary` (`#08121A`) / `colors.background` on dark surfaces

### Usage points

| Location | Trigger |
|---|---|
| `app/(tabs)/settings.tsx` | "Upgrade to Pro" row (`handleUpgradeToPro`) |
| `app/(tabs)/insights.tsx` | Free user taps Insights tab |
| `app/(tabs)/subscriptions.tsx` | Free user taps "Export Data" row |

Each screen holds its own `paywallVisible` boolean state and renders `<PaywallModal visible={paywallVisible} onDismiss={() => setPaywallVisible(false)} />`.

---

## Convex Webhook Handler (`convex/http.ts`)

### Endpoint

`POST /webhooks/clerk-billing`

### Dependencies

- `svix` npm package — for signature verification
- `CLERK_WEBHOOK_SECRET` — set in Convex dashboard environment variables (not `.env.local`)

### Logic

```
1. Read raw body as text
2. Extract headers: svix-id, svix-timestamp, svix-signature
3. Verify signature with svix Webhook.verify()
   → invalid: return 400
4. Parse JSON body, extract event type + payload
5. Switch on event type:
   - subscription.created  → console.log (v1 stub; v2: upsert billing record)
   - subscription.updated  → console.log (v1 stub; v2: update billing record / revoke Pro if status=cancelled)
   - subscription.deleted  → console.log (v1 stub; v2: mark user as free in billing record)
   - default               → return 200 (acknowledge, ignore)
6. Return 200
```

**Session token / entitlement lag:** Clerk's session token is a JWT with a configurable TTL (default: 1 minute for short-lived tokens, up to days for long-lived). When `subscription.deleted` fires and only a `console.log` runs, a cancelled user retains Pro entitlement until their token next refreshes. In v1 this is acceptable — the app has no server-side enforcement path to revoke the token mid-session. In v2, the webhook handler should invalidate active sessions for the affected user via the Clerk Backend API when `subscription.deleted` fires.

### Wiring

```ts
// convex/http.ts
import { httpRouter } from "convex/server"
const http = httpRouter()
http.route({
  path: "/webhooks/clerk-billing",
  method: "POST",
  handler: clerkBillingWebhook,
})
export default http
```

Convex picks up `http.ts` automatically as the HTTP router — no additional config needed.

### Error handling

| Condition | Response |
|---|---|
| Missing svix headers | 400 |
| Signature verification fails | 400 |
| Unknown event type | 200 (no-op) |
| Handler error | 500 (Convex default) |

---

## Environment Variables

### `.env.local` (Expo / React Native)

| Variable | Value | Source |
|---|---|---|
| `EXPO_PUBLIC_CLERK_CHECKOUT_URL` | Hosted checkout URL for Pro plan | Clerk Dashboard → plan page |

### Convex Dashboard Environment Variables

| Variable | Value | Source |
|---|---|---|
| `CLERK_WEBHOOK_SECRET` | Webhook signing secret | Clerk Dashboard → webhooks |

---

## Deferred / Out of Scope

- **Billing record in Convex** — no `billing` table in v1. Entitlement is read entirely from the Clerk session token. A `billing` table (for showing renewal dates in Settings) is a v2 addition.
- **Cancellation flow** — no in-app cancel. Users manage their subscription via the Clerk account portal (already wired in Settings → Manage Account).
- **Refunds** — handled directly in Stripe; not reflected in the app.
- **Non-USD currencies** — Clerk Billing is USD-only; multi-currency display is a separate Pro feature about showing subscription amounts in local currencies, not billing currency.
