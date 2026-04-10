# Clerk Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pro tier to Recurrly via Clerk Billing — PaywallModal component, Settings/Insights entitlement gating, and a Convex webhook handler for subscription lifecycle events.

**Architecture:** Clerk-native checkout — PaywallModal shows Pro features + static pricing, "Upgrade Now" opens Clerk's hosted checkout in `expo-web-browser`, session is reloaded on return. Entitlement read from Clerk session token (`has({ feature: "pro" })`). Convex HTTP action receives Clerk billing webhooks, verifies svix signatures, and logs events (v1 stub).

**Tech Stack:** Expo Router · `@clerk/clerk-expo` · `expo-web-browser` (already installed) · `svix` (to install) · Convex HTTP actions

---

## Prerequisites

- Clerk Dashboard steps from the spec must be completed before Task 6 can be tested end-to-end:
  - Connect Stripe, create Pro plan ($4.99/mo + $39.99/yr), add `pro` feature, register webhook
  - Copy the hosted checkout URL → `EXPO_PUBLIC_CLERK_CHECKOUT_URL` in `.env.local`
  - Copy the webhook signing secret → `CLERK_WEBHOOK_SECRET` in Convex dashboard env vars
- Convex must be initialized before Task 6: run `npx convex dev` once to create `convex.json` and authenticate. The deployment URL goes in `.env.local` as `EXPO_PUBLIC_CONVEX_URL`.

---

## File Structure

**New files:**
- `components/PaywallModal.tsx` — controlled full-screen modal; renders feature list, pricing, upgrade CTA
- `convex/http.ts` — Convex HTTP router; registers the webhook route
- `convex/billingWebhook.ts` — HTTP action; verifies svix signature, switches on event type

**Modified files:**
- `.env.local` — add `EXPO_PUBLIC_CLERK_CHECKOUT_URL` placeholder
- `app/(tabs)/settings.tsx` — replace two `Alert.alert` billing placeholders with PaywallModal state; render `<PaywallModal>`
- `app/(tabs)/insights.tsx` — add entitlement check + `<PaywallModal>` (visible by default for free users)

**New test files:**
- `__tests__/components/PaywallModal.test.tsx`
- `__tests__/insights.test.tsx`

**Modified test files:**
- `__tests__/settings.test.tsx` — add tests for paywall open behavior

---

## Tasks

### Task 1: Install svix + add env var placeholder

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install svix**

```bash
npm install svix
```

Expected output: `added 1 package` (or similar, no errors)

- [ ] **Step 2: Add checkout URL placeholder to .env.local**

Append to `.env.local`:
```
EXPO_PUBLIC_CLERK_CHECKOUT_URL=
```

(Leave the value blank for now — fill in after Clerk Dashboard plan is created.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.local
git commit -m "chore: install svix, add EXPO_PUBLIC_CLERK_CHECKOUT_URL placeholder"
```

---

### Task 2: Build PaywallModal — tests first

**Files:**
- Create: `__tests__/components/PaywallModal.test.tsx`
- Create: `components/PaywallModal.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/components/PaywallModal.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import React from "react"
import PaywallModal from "../../components/PaywallModal"

const mockOpenBrowser = jest.fn()
const mockSessionReload = jest.fn()

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...args),
}))

jest.mock("@clerk/clerk-expo", () => ({
  useClerk: jest.fn(),
}))

import { useClerk } from "@clerk/clerk-expo"

function setup() {
  ;(useClerk as jest.Mock).mockReturnValue({
    session: { reload: mockSessionReload },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL = "https://checkout.example.com/pro"
})

describe("PaywallModal — rendering", () => {
  it("renders feature list when visible", () => {
    setup()
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    expect(screen.getByText("Monthly Insights & spending trends")).toBeTruthy()
    expect(screen.getByText("Full spending history")).toBeTruthy()
    expect(screen.getByText("Export to CSV / JSON")).toBeTruthy()
    expect(screen.getByText("Multi-currency display")).toBeTruthy()
  })

  it("renders pricing text", () => {
    setup()
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    expect(screen.getByText("$4.99")).toBeTruthy()
    expect(screen.getByText("$39.99")).toBeTruthy()
  })

  it("does not render when visible=false", () => {
    setup()
    render(<PaywallModal visible={false} onDismiss={jest.fn()} />)
    expect(screen.queryByTestId("paywall-upgrade-btn")).toBeNull()
  })
})

describe("PaywallModal — dismiss", () => {
  it("calls onDismiss when close button is pressed", () => {
    setup()
    const onDismiss = jest.fn()
    render(<PaywallModal visible onDismiss={onDismiss} />)
    fireEvent.press(screen.getByTestId("paywall-close-btn"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("calls onDismiss when Maybe later is pressed", () => {
    setup()
    const onDismiss = jest.fn()
    render(<PaywallModal visible onDismiss={onDismiss} />)
    fireEvent.press(screen.getByTestId("paywall-dismiss-btn"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe("PaywallModal — upgrade", () => {
  it("opens browser with checkout URL when Upgrade Now is pressed", async () => {
    setup()
    mockOpenBrowser.mockResolvedValue(undefined)
    mockSessionReload.mockResolvedValue(undefined)
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    fireEvent.press(screen.getByTestId("paywall-upgrade-btn"))
    await waitFor(() => {
      expect(mockOpenBrowser).toHaveBeenCalledWith("https://checkout.example.com/pro")
    })
  })

  it("reloads session after browser closes", async () => {
    setup()
    mockOpenBrowser.mockResolvedValue(undefined)
    mockSessionReload.mockResolvedValue(undefined)
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    fireEvent.press(screen.getByTestId("paywall-upgrade-btn"))
    await waitFor(() => {
      expect(mockSessionReload).toHaveBeenCalledTimes(1)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/PaywallModal.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../../components/PaywallModal'`

- [ ] **Step 3: Implement PaywallModal**

Create `components/PaywallModal.tsx`:

```tsx
import { useClerk } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import { Modal, Pressable, Text, View } from "react-native"

type PaywallModalProps = {
  visible: boolean
  onDismiss: () => void
}

const FEATURES = [
  "Monthly Insights & spending trends",
  "Full spending history",
  "Export to CSV / JSON",
  "Multi-currency display",
]

export default function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const clerk = useClerk()

  async function handleUpgrade() {
    await WebBrowser.openBrowserAsync(
      process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL!
    )
    await clerk.session?.reload()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View className="flex-1 bg-background">
        {/* Close button */}
        <Pressable
          testID="paywall-close-btn"
          onPress={onDismiss}
          className="absolute top-12 right-5 z-10 p-2"
        >
          <Text className="text-2xl font-sans-bold text-primary">×</Text>
        </Pressable>

        {/* Header */}
        <View className="bg-accent pt-16 pb-10 px-6 items-center">
          <Text className="text-3xl font-sans-bold text-background mb-2">
            Recurrly Pro
          </Text>
          <Text className="text-base font-sans-medium text-background opacity-80">
            Unlock everything
          </Text>
        </View>

        {/* Feature list */}
        <View className="flex-1 px-6 pt-8">
          {FEATURES.map((feature) => (
            <View key={feature} className="flex-row items-center gap-3 mb-4">
              <Text className="text-accent text-lg font-sans-bold">✓</Text>
              <Text className="text-base font-sans-medium text-primary">
                {feature}
              </Text>
            </View>
          ))}

          {/* Pricing */}
          <View className="mt-6 items-center">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              <Text className="font-sans-bold text-primary">$4.99</Text>
              /month or{" "}
              <Text className="font-sans-bold text-primary">$39.99</Text>
              /year
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View className="px-6 pb-10 gap-3">
          <Pressable
            testID="paywall-upgrade-btn"
            onPress={handleUpgrade}
            className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-base font-sans-bold text-background">
              Upgrade Now
            </Text>
          </Pressable>
          <Pressable
            testID="paywall-dismiss-btn"
            onPress={onDismiss}
            className="items-center py-2"
          >
            <Text className="text-sm font-sans-medium text-muted-foreground">
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/PaywallModal.test.tsx --no-coverage
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/PaywallModal.tsx __tests__/components/PaywallModal.test.tsx
git commit -m "feat: add PaywallModal component with Clerk checkout integration"
```

---

### Task 3: Wire PaywallModal into Settings

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Modify: `__tests__/settings.test.tsx`

- [ ] **Step 1: Add new failing tests to settings.test.tsx**

Add a new mock for `PaywallModal` at the top of `__tests__/settings.test.tsx`, after the existing mocks:

```tsx
jest.mock("../../components/PaywallModal", () => {
  const { Pressable, Text } = require("react-native")
  return function MockPaywallModal({
    visible,
    onDismiss,
  }: {
    visible: boolean
    onDismiss: () => void
  }) {
    if (!visible) return null
    return (
      <>
        <Pressable testID="paywall-upgrade-btn" onPress={jest.fn()} />
        <Pressable testID="paywall-dismiss-btn" onPress={onDismiss} />
      </>
    )
  }
})
```

Then add a new `describe` block at the bottom of the file:

```tsx
describe("Settings — paywall triggers", () => {
  it("opens paywall when Upgrade to Pro row is pressed", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    fireEvent.press(screen.getByText("Upgrade to Pro"))
    expect(screen.getByTestId("paywall-upgrade-btn")).toBeTruthy()
  })

  it("opens paywall when Export Data row is pressed by free user", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    fireEvent.press(screen.getByTestId("export-data-btn"))
    expect(screen.getByTestId("paywall-upgrade-btn")).toBeTruthy()
  })

  it("does not show paywall on mount", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.queryByTestId("paywall-upgrade-btn")).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
npx jest __tests__/settings.test.tsx --no-coverage
```

Expected: existing 11 pass, 3 new tests FAIL

- [ ] **Step 3: Update settings.tsx**

Replace the import section and state at the top of `app/(tabs)/settings.tsx`. Add the PaywallModal import after the existing imports:

```tsx
import PaywallModal from "@/components/PaywallModal"
```

Add `paywallVisible` state alongside the existing state declarations:

```tsx
const [paywallVisible, setPaywallVisible] = useState(false)
```

Replace `handleUpgradeToPro`:

```tsx
function handleUpgradeToPro() {
  setPaywallVisible(true)
}
```

Replace the free-user branch of `handleExportData`:

```tsx
function handleExportData() {
  if (!isPro) {
    setPaywallVisible(true)
    return
  }
  Alert.alert("Export Data", "Export coming soon!")
}
```

Add `testID="export-data-btn"` to the Export Data `SettingsRow`:

```tsx
<SettingsRow
  testID="export-data-btn"
  iconBg={colors.muted}
  icon="📤"
  label="Export Data"
  ...
```

Add `<PaywallModal>` just before the closing `</ScrollView>` tag (inside `ScrollView`, after the Sign Out block):

```tsx
        <PaywallModal
          visible={paywallVisible}
          onDismiss={() => setPaywallVisible(false)}
        />
      </ScrollView>
```

- [ ] **Step 4: Run all settings tests**

```bash
npx jest __tests__/settings.test.tsx --no-coverage
```

Expected: All 14 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/settings.tsx __tests__/settings.test.tsx
git commit -m "feat: wire PaywallModal into Settings screen"
```

---

### Task 4: Wire PaywallModal into Insights

**Files:**
- Create: `__tests__/insights.test.tsx`
- Modify: `app/(tabs)/insights.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/insights.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native"
import React from "react"
import Insights from "../app/(tabs)/insights"

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}))

jest.mock("../components/PaywallModal", () => {
  const { Pressable } = require("react-native")
  return function MockPaywallModal({
    visible,
  }: {
    visible: boolean
    onDismiss: () => void
  }) {
    if (!visible) return null
    return <Pressable testID="paywall-upgrade-btn" onPress={jest.fn()} />
  }
})

jest.mock("@/lib/interop", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

import { useAuth } from "@clerk/clerk-expo"

function setupClerk({ isPro = false } = {}) {
  ;(useAuth as jest.Mock).mockReturnValue({
    has: ({ feature }: { feature: string }) =>
      feature === "pro" ? isPro : false,
  })
}

describe("Insights — paywall gating", () => {
  it("shows paywall modal for free users", () => {
    setupClerk({ isPro: false })
    render(<Insights />)
    expect(screen.getByTestId("paywall-upgrade-btn")).toBeTruthy()
  })

  it("does not show paywall for pro users", () => {
    setupClerk({ isPro: true })
    render(<Insights />)
    expect(screen.queryByTestId("paywall-upgrade-btn")).toBeNull()
  })

  it("renders screen content for pro users", () => {
    setupClerk({ isPro: true })
    render(<Insights />)
    expect(screen.getByText("Insights")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx jest __tests__/insights.test.tsx --no-coverage
```

Expected: FAIL — paywall tests fail because current Insights is a stub with no entitlement check

- [ ] **Step 3: Update insights.tsx**

Replace `app/(tabs)/insights.tsx` with:

```tsx
import { SafeAreaView } from "@/lib/interop"
import PaywallModal from "@/components/PaywallModal"
import { useAuth } from "@clerk/clerk-expo"
import { useState } from "react"
import { Text } from "react-native"

export default function Insights() {
  const { has } = useAuth()
  const isPro = has({ feature: "pro" })
  const [paywallVisible, setPaywallVisible] = useState(!isPro)

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Insights</Text>
      <PaywallModal
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/insights.test.tsx --no-coverage
```

Expected: All 3 tests PASS

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx jest --no-coverage
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/insights.tsx __tests__/insights.test.tsx
git commit -m "feat: add paywall gating to Insights screen"
```

---

### Task 5: Convex billing webhook handler

**Files:**
- Create: `convex/billingWebhook.ts`
- Create: `convex/http.ts`

> **Prerequisite:** Convex must be initialized before these files can be deployed. If `convex.json` does not exist, run `npx convex dev` once, follow the prompts to create a project, then copy the deployment URL into `.env.local` as `EXPO_PUBLIC_CONVEX_URL`. After initializing, add `CLERK_WEBHOOK_SECRET` to the Convex dashboard under **Settings → Environment Variables**.

- [ ] **Step 1: Create the webhook handler**

Create `convex/billingWebhook.ts`:

```ts
import { httpAction } from "convex/server"
import { Webhook } from "svix"

export const clerkBillingWebhook = httpAction(async (_ctx, request) => {
  // 1. Read raw body
  const body = await request.text()

  // 2. Extract svix signature headers
  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  // 3. Verify signature
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error("[billing] CLERK_WEBHOOK_SECRET is not set")
    return new Response("Server misconfiguration", { status: 500 })
  }

  let event: { type: string; data: unknown }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: unknown }
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  // 4. Handle events
  // v1: log only. v2: upsert billing record / revoke session on subscription.deleted
  switch (event.type) {
    case "subscription.created":
      console.log("[billing] subscription.created", JSON.stringify(event.data))
      break
    case "subscription.updated":
      console.log("[billing] subscription.updated", JSON.stringify(event.data))
      break
    case "subscription.deleted":
      // NOTE: user retains Pro entitlement until Clerk session token expires.
      // In v2, call Clerk Backend API to revoke active sessions for this user.
      console.log("[billing] subscription.deleted", JSON.stringify(event.data))
      break
    default:
      // Unknown event type — acknowledge and ignore
      break
  }

  return new Response(null, { status: 200 })
})
```

- [ ] **Step 2: Create the HTTP router**

Create `convex/http.ts`:

```ts
import { httpRouter } from "convex/server"
import { clerkBillingWebhook } from "./billingWebhook"

const http = httpRouter()

http.route({
  path: "/webhooks/clerk-billing",
  method: "POST",
  handler: clerkBillingWebhook,
})

export default http
```

- [ ] **Step 3: Deploy and verify in Convex dashboard**

Start the Convex dev server (in a separate terminal if not already running):

```bash
npx convex dev
```

Expected: Convex logs `✔ Deployed functions` with no errors. Check the Convex dashboard → Functions → HTTP Actions — you should see `/webhooks/clerk-billing` listed.

- [ ] **Step 4: Manual smoke test with curl**

Send a test request to verify the route is reachable and returns 400 on missing headers (signature check fires before event parsing):

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  https://<your-deployment>.convex.site/webhooks/clerk-billing \
  -H "Content-Type: application/json" \
  -d '{"type":"subscription.created","data":{}}'
```

Replace `<your-deployment>` with your Convex deployment slug (visible in the Convex dashboard URL or `convex.json`).

Expected output: `400` (missing svix headers → correct rejection)

- [ ] **Step 5: Commit**

```bash
git add convex/billingWebhook.ts convex/http.ts
git commit -m "feat: add Convex billing webhook handler with svix verification"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| Clerk Dashboard steps documented | Prerequisites section |
| `EXPO_PUBLIC_CLERK_CHECKOUT_URL` env var | Task 1 |
| `svix` installed | Task 1 |
| PaywallModal — feature list, pricing, close, dismiss | Task 2 |
| PaywallModal — opens browser + reloads session | Task 2 |
| Settings: Upgrade to Pro → paywall | Task 3 |
| Settings: Export Data (free) → paywall | Task 3 |
| Insights: free user → paywall on mount | Task 4 |
| `convex/http.ts` HTTP router | Task 5 |
| `convex/billingWebhook.ts` svix verification | Task 5 |
| `subscription.created/updated/deleted` handling | Task 5 |
| Session token lag noted in code comment | Task 5 |

All spec requirements covered. ✓

### Notes

- `expo-web-browser` is already installed (`~15.0.10`) — no install step needed.
- `convex/` directory does not exist yet — the Convex prerequisite step in Task 5 handles initialization.
- The `PaywallModal` is not unit-tested for the `clerk.session?.reload()` null-safety path (session may be undefined). The `?.` optional chaining handles it gracefully at runtime; no additional test needed.
