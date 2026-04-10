# Settings Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub `app/(tabs)/settings.tsx` with a fully designed Settings screen matching the approved Option C design: compact account card (Clerk data), icon-row grouped sections, Pro/Free entitlement gating, and a red-bordered sign-out row.

**Architecture:** Self-contained screen component — no new shared components. Clerk data via `useUser()` and `useAuth()`. Entitlement gating via `useAuth().has({ feature: "pro" })`. Account portal via `expo-web-browser`. All Data/Notifications actions are UI placeholders (Alert.alert) deferred for v1.

**Tech Stack:** React Native · NativeWind v5 · `@clerk/clerk-expo` (`useUser`, `useAuth`, `useClerk`) · `expo-web-browser` · Jest + `@testing-library/react-native`

---

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Modify | `app/(tabs)/settings.tsx` | Full settings screen — account card, grouped rows, sign out |
| Create | `__tests__/settings.test.tsx` | Component tests for entitlement gating + render logic |

---

## Task 1: Write the failing tests

**Files:**
- Create: `__tests__/settings.test.tsx`

- [ ] **Step 1: Create the test file with mocks and failing tests**

```tsx
// __tests__/settings.test.tsx
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native"
import Settings from "../app/(tabs)/settings"

// ── Clerk mocks ──────────────────────────────────────────────────────────────
const mockSignOut = jest.fn()
const mockOpenBrowser = jest.fn()

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
  useClerk: jest.fn(),
}))

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...args),
}))

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock("@/lib/interop", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  Image: (props: any) => {
    const { View } = require("react-native")
    return <View testID="image" {...props} />
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
import { useUser, useAuth, useClerk } from "@clerk/clerk-expo"

function setupClerk({ isPro = false } = {}) {
  ;(useUser as jest.Mock).mockReturnValue({
    user: {
      fullName: "Adrian Hajdin",
      firstName: "Adrian",
      primaryEmailAddress: { emailAddress: "adrian@example.com" },
      imageUrl: "https://example.com/avatar.jpg",
    },
  })
  ;(useAuth as jest.Mock).mockReturnValue({
    signOut: mockSignOut,
    has: ({ feature }: { feature: string }) =>
      feature === "pro" ? isPro : false,
  })
  ;(useClerk as jest.Mock).mockReturnValue({})
}

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks()
})

describe("Settings — account card", () => {
  it("renders user name and email", () => {
    setupClerk()
    render(<Settings />)
    expect(screen.getByText("Adrian Hajdin")).toBeTruthy()
    expect(screen.getByText("adrian@example.com")).toBeTruthy()
  })

  it("shows FREE badge for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByText("FREE")).toBeTruthy()
    expect(screen.queryByText("PRO")).toBeNull()
  })

  it("shows PRO badge for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.getByText("PRO")).toBeTruthy()
    expect(screen.queryByText("FREE")).toBeNull()
  })
})

describe("Settings — PLAN section", () => {
  it("shows Upgrade to Pro row for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByText("Upgrade to Pro")).toBeTruthy()
  })

  it("hides Upgrade to Pro row for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.queryByText("Upgrade to Pro")).toBeNull()
  })
})

describe("Settings — DATA section", () => {
  it("shows PRO pill on Export Data for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByTestId("export-pro-pill")).toBeTruthy()
  })

  it("hides PRO pill on Export Data for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.queryByTestId("export-pro-pill")).toBeNull()
  })

  it("always renders Import CSV row", () => {
    setupClerk()
    render(<Settings />)
    expect(screen.getByText("Import CSV")).toBeTruthy()
  })
})

describe("Settings — sign out", () => {
  it("calls signOut when Sign Out row is pressed", async () => {
    setupClerk()
    mockSignOut.mockResolvedValue(undefined)
    render(<Settings />)
    fireEvent.press(screen.getByTestId("sign-out-btn"))
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it("disables Sign Out while signing out", async () => {
    setupClerk()
    let resolve: () => void
    mockSignOut.mockReturnValue(new Promise<void>(r => { resolve = r }))
    render(<Settings />)
    fireEvent.press(screen.getByTestId("sign-out-btn"))
    expect(screen.getByText("Signing Out…")).toBeTruthy()
    resolve!()
  })
})

describe("Settings — Manage Account", () => {
  it("opens browser when Manage Account is pressed", async () => {
    setupClerk()
    mockOpenBrowser.mockResolvedValue(undefined)
    render(<Settings />)
    fireEvent.press(screen.getByTestId("manage-account-btn"))
    await waitFor(() => {
      expect(mockOpenBrowser).toHaveBeenCalledTimes(1)
    })
  })
})
```

- [ ] **Step 2: Run tests and confirm they all fail**

```bash
cd "d:/Web Dev/2026/recurrly_app"
npx jest __tests__/settings.test.tsx --no-coverage
```

Expected: All tests FAIL — `Settings` is a stub that renders nothing matching these selectors.

---

## Task 2: Implement the Settings screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Replace the stub with the full implementation**

```tsx
// app/(tabs)/settings.tsx
import { Image, SafeAreaView } from "@/lib/interop"
import images from "@/constants/images"
import { colors, components } from "@/constants/theme"
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import { useState } from "react"
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <Text className="text-[10px] font-sans-bold text-muted-foreground tracking-widest uppercase mb-1.5 pl-1">
      {title}
    </Text>
  )
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-2xl border border-border overflow-hidden">
      {children}
    </View>
  )
}

type SettingsRowProps = {
  iconBg: string
  icon: string
  label: string
  subtitle?: string
  right: React.ReactNode
  onPress?: () => void
  testID?: string
  divider?: boolean
}

function SettingsRow({
  iconBg,
  icon,
  label,
  subtitle,
  right,
  onPress,
  testID,
  divider = false,
}: SettingsRowProps) {
  return (
    <>
      {divider && <View className="h-px bg-border mx-4" />}
      <Pressable
        testID={testID}
        onPress={onPress}
        className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
      >
        <View
          className="size-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Text style={{ fontSize: 15 }}>{icon}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-sm font-sans-semibold text-primary">{label}</Text>
          {subtitle ? (
            <Text className="text-xs font-sans-medium text-muted-foreground mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </Pressable>
    </>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function Settings() {
  const { user } = useUser()
  const { signOut, has } = useAuth()
  const clerk = useClerk()
  const insets = useSafeAreaInsets()
  const { tabBar } = components

  const isPro = has({ feature: "pro" })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User"
  const email = user?.primaryEmailAddress?.emailAddress ?? ""
  const avatarUri = user?.imageUrl

  async function handleManageAccount() {
    const url =
      typeof (clerk as any).buildAccountPortalUrl === "function"
        ? (clerk as any).buildAccountPortalUrl()
        : "https://accounts.clerk.com"
    await WebBrowser.openBrowserAsync(url)
  }

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      console.error("Sign out failed", err)
    } finally {
      setIsSigningOut(false)
    }
  }

  function handleUpgradeToPro() {
    Alert.alert("Upgrade to Pro", "Pro upgrade coming soon!")
  }

  function handleExportData() {
    if (!isPro) {
      Alert.alert("Pro Feature", "Export requires a Pro subscription.")
      return
    }
    Alert.alert("Export Data", "Export coming soon!")
  }

  function handleImportCSV() {
    Alert.alert("Import CSV", "CSV import coming soon!")
  }

  const bottomPadding =
    Math.max(insets.bottom, tabBar.horizontalInset) + tabBar.height

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text className="text-2xl font-sans-bold text-primary mb-5">
          Settings
        </Text>

        {/* ── Account card ──────────────────────────────────────────────── */}
        <View className="bg-muted rounded-2xl p-4 flex-row items-center gap-3 mb-5">
          <Image
            source={avatarUri ? { uri: avatarUri } : images.avatar}
            className="size-14 rounded-full"
          />
          <View className="flex-1 min-w-0">
            <Text
              className="text-[15px] font-sans-bold text-primary"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="text-xs font-sans-medium text-muted-foreground"
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{
              backgroundColor: isPro ? colors.primary : colors.accent,
            }}
          >
            <Text className="text-[11px] font-sans-bold text-background tracking-wider">
              {isPro ? "PRO" : "FREE"}
            </Text>
          </View>
        </View>

        {/* ── ACCOUNT section ───────────────────────────────────────────── */}
        <SectionLabel title="Account" />
        <View className="mb-5">
          <SettingsGroup>
            <SettingsRow
              testID="manage-account-btn"
              iconBg={colors.muted}
              icon="👤"
              label="Manage Account"
              subtitle="Edit profile, change password"
              right={
                <Text className="text-sm text-muted-foreground">→</Text>
              }
              onPress={handleManageAccount}
            />
          </SettingsGroup>
        </View>

        {/* ── GENERAL section ───────────────────────────────────────────── */}
        <SectionLabel title="General" />
        <View className="mb-5">
          <SettingsGroup>
            <SettingsRow
              iconBg={colors.muted}
              icon="🔔"
              label="Notifications"
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: colors.muted,
                    true: colors.accent,
                  }}
                  thumbColor="#ffffff"
                />
              }
            />
          </SettingsGroup>
        </View>

        {/* ── PLAN section (free users only) ────────────────────────────── */}
        {!isPro && (
          <>
            <SectionLabel title="Plan" />
            <View className="mb-5">
              <SettingsGroup>
                <SettingsRow
                  iconBg="#fde8df"
                  icon="⭐"
                  label="Upgrade to Pro"
                  subtitle="Analytics, export, multi-currency"
                  right={
                    <Text className="text-sm font-sans-bold text-accent">→</Text>
                  }
                  onPress={handleUpgradeToPro}
                />
              </SettingsGroup>
            </View>
          </>
        )}

        {/* ── DATA section ──────────────────────────────────────────────── */}
        <SectionLabel title="Data" />
        <View className="mb-5">
          <SettingsGroup>
            <SettingsRow
              iconBg={colors.muted}
              icon="📤"
              label="Export Data"
              right={
                isPro ? (
                  <Text className="text-sm text-muted-foreground">→</Text>
                ) : (
                  <View
                    testID="export-pro-pill"
                    className="rounded-lg px-2 py-0.5 bg-muted"
                  >
                    <Text className="text-[10px] font-sans-bold text-muted-foreground tracking-wider">
                      PRO
                    </Text>
                  </View>
                )
              }
              onPress={handleExportData}
            />
            <SettingsRow
              iconBg={colors.muted}
              icon="📥"
              label="Import CSV"
              right={
                <Text className="text-sm text-muted-foreground">→</Text>
              }
              onPress={handleImportCSV}
              divider
            />
          </SettingsGroup>
        </View>

        {/* ── Sign Out ──────────────────────────────────────────────────── */}
        <Pressable
          testID="sign-out-btn"
          disabled={isSigningOut}
          onPress={handleSignOut}
          className="flex-row items-center gap-3 px-4 py-3.5 rounded-2xl border border-destructive/20 bg-destructive/5 active:opacity-70"
          style={isSigningOut ? { opacity: 0.5 } : undefined}
        >
          <View className="size-8 rounded-lg items-center justify-center bg-red-100">
            <Text style={{ fontSize: 15 }}>🚪</Text>
          </View>
          <Text className="flex-1 text-sm font-sans-semibold text-destructive">
            {isSigningOut ? "Signing Out…" : "Sign Out"}
          </Text>
          {!isSigningOut && (
            <Text className="text-sm text-destructive">→</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 2: Run the tests and confirm they pass**

```bash
cd "d:/Web Dev/2026/recurrly_app"
npx jest __tests__/settings.test.tsx --no-coverage
```

Expected output: All tests PASS (14 tests across 5 describe blocks).

If `SafeAreaView` or `Image` interop mocks cause issues, check that `@/lib/interop` exports match what's mocked in the test file.

- [ ] **Step 3: Commit**

```bash
cd "d:/Web Dev/2026/recurrly_app"
git add app/(tabs)/settings.tsx __tests__/settings.test.tsx
git commit -m "feat: implement Settings screen with Clerk integration

- Account card with avatar, name, email from useUser()
- FREE/PRO badge from useAuth().has({ feature: 'pro' })
- Manage Account row opens Clerk portal via expo-web-browser
- Notifications toggle (UI placeholder)
- Upgrade to Pro row hidden for Pro users
- Export Data locked behind PRO pill for free users
- Import CSV placeholder row
- Sign Out with loading state

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Manual smoke test

**Files:** none — verification only

- [ ] **Step 1: Start the dev server**

```bash
cd "d:/Web Dev/2026/recurrly_app"
npx expo start
```

- [ ] **Step 2: Verify on device/simulator**

Open the app, navigate to the Settings tab and confirm:

| Check | Expected |
|---|---|
| Account card | Shows real Clerk avatar, name, email |
| Plan badge | FREE (coral) for free account |
| PLAN section | "Upgrade to Pro" row visible |
| Export Data | PRO pill visible |
| Import CSV | Row present with chevron |
| Manage Account | Opens browser |
| Notifications | Toggle responds to tap |
| Sign Out | Shows "Signing Out…" while in-flight, then redirects |

- [ ] **Step 3: Final commit if any tweaks were made during smoke test**

```bash
git add -p
git commit -m "fix: settings screen smoke test adjustments

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
