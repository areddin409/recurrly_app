# Settings Screen — Design Spec
**Date:** 2026-04-08
**Scope:** `app/(tabs)/settings.tsx` + any extracted sub-components

---

## Overview

The Settings screen uses Option C layout: compact account card at the top with an inline plan badge, followed by grouped icon-row sections, and a red-bordered sign-out row pinned at the bottom. All Clerk data (avatar, name, email, entitlements) is consumed via hooks — no Clerk prebuilt UI components exist in the Expo SDK.

---

## Layout Structure

```
Settings (scroll view)
├── Page title — "Settings"
├── Account card  (cream muted bg, rounded)
│   ├── Avatar  (user.imageUrl → fallback local asset)
│   ├── Display name  (user.fullName || user.firstName)
│   ├── Email  (user.primaryEmailAddress?.emailAddress)
│   └── Plan badge  (FREE coral | PRO navy)
│
├── ACCOUNT section
│   └── Manage Account row  → Clerk account portal (expo-web-browser)
│
├── GENERAL section
│   └── Notifications row  (Toggle — UI only, implementation deferred)
│
├── PLAN section  (free users only — hidden when isPro)
│   └── Upgrade to Pro row  → paywall modal
│
├── DATA section
│   ├── Export Data row  (PRO pill for free users → paywall; chevron for Pro)
│   └── Import CSV row   (chevron — placeholder, always tappable)
│
└── Sign Out row  (red-bordered, full-width, loading state preserved)
```

---

## Sections & Rows

### Account Card

| Property | Value |
|---|---|
| Background | `bg-muted` (`#f6eecf`) |
| Border radius | `rounded-2xl` |
| Avatar size | 52×52, `rounded-full` |
| Avatar fallback | `images.avatar` (local asset, same pattern as HomeHeader) |
| Name | `user.fullName \|\| user.firstName \|\| email local-part \|\| "User"` |
| Email | `user.primaryEmailAddress?.emailAddress` |
| FREE badge | coral background (`bg-accent`), white text |
| PRO badge | navy background (`bg-primary`), cream text (`text-background`) |

### Row anatomy (all groups)

Each row is a `Pressable` containing:
- **Icon chip** — 30×30, `rounded-lg`, muted background, emoji/icon centered
- **Label** — `font-sans-semibold text-sm text-primary`, flex:1
- **Right element** — one of: chevron, toggle, PRO pill, coral chevron

Rows within a group are wrapped in a `View` with `bg-card rounded-2xl border border-border overflow-hidden`. Dividers between rows are `border-b border-border`.

### Section labels

`text-[10px] font-sans-bold text-muted-foreground tracking-widest` uppercase, 7px margin-bottom, 4px left padding.

### ACCOUNT group

| Row | Icon chip bg | Right element | Action |
|---|---|---|---|
| Manage Account | `bg-muted` | chevron | `WebBrowser.openBrowserAsync(clerk.buildAccountPortalUrl?.() ?? CLERK_ACCOUNT_URL)` |

### GENERAL group

| Row | Icon chip bg | Right element | Action |
|---|---|---|---|
| Notifications | `bg-muted` | `Switch` (RN core) | Local state toggle — no-op, UI placeholder only |

Toggle: on = coral thumb-right, off = muted thumb-left. Uses RN `Switch` with `trackColor` and `thumbColor` from theme.

### PLAN group (free users only)

Rendered only when `!isPro`. Hidden entirely for Pro users (not grayed out).

| Row | Icon chip bg | Right element | Action |
|---|---|---|---|
| Upgrade to Pro | `#fde8df` (light coral tint) | coral chevron | Navigate to paywall modal (deferred — `Alert.alert` placeholder in v1) |

Subtitle line under label: `"Analytics, export, multi-currency"` in `text-xs text-muted-foreground`.

### DATA group

| Row | Icon chip bg | Right element (free) | Right element (Pro) | Action |
|---|---|---|---|---|
| Export Data | `bg-muted` | PRO pill → paywall | chevron → placeholder alert | Alert placeholder in v1 |
| Import CSV | `bg-muted` | chevron | chevron | Alert placeholder in v1 |

PRO pill style: `text-[10px] font-sans-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-lg`.

### Sign Out row

Standalone `Pressable` (not inside a group card). Style: `border border-destructive/20 rounded-2xl bg-destructive/5`. Icon chip bg: `#fee2e2`. Label color: `text-destructive`. Preserves existing `isSigningOut` loading state + disabled logic from current stub.

---

## State & Entitlements

```tsx
const { signOut } = useAuth()
const isPro = useAuth().has({ feature: "pro" })
const { user } = useUser()
const [notificationsEnabled, setNotificationsEnabled] = useState(true)
const [isSigningOut, setIsSigningOut] = useState(false)
```

`isPro` drives:
- Badge color (FREE coral vs PRO navy)
- Visibility of PLAN section
- Export Data right element (PRO pill vs chevron)

---

## Clerk Integration

| Element | Clerk API |
|---|---|
| Avatar | `user.imageUrl` → fallback `images.avatar` |
| Name | `user.fullName \|\| user.firstName` |
| Email | `user.primaryEmailAddress?.emailAddress` |
| Plan badge | `useAuth().has({ feature: "pro" })` |
| Manage Account | `WebBrowser.openBrowserAsync(clerk.buildAccountPortalUrl?.() ?? "https://accounts.clerk.com")` |
| Sign out | `useAuth().signOut()` |

`clerk` instance accessed via `useClerk()` hook from `@clerk/clerk-expo`.

---

## Component Extraction

The screen is self-contained in `app/(tabs)/settings.tsx`. No new shared components needed — all sub-elements (rows, section labels, account card) are local to the file. If the file grows beyond ~150 lines, extract a `SettingsRow` component inline.

---

## Deferred / Out of Scope

- **Notifications implementation** — toggle renders but has no effect. Backend integration deferred.
- **Export Data implementation** — tapping shows `Alert.alert("Coming soon")` for both free (after paywall) and Pro users.
- **Import CSV implementation** — tapping shows `Alert.alert("Coming soon")`.
- **Paywall modal** — Upgrade to Pro row and locked Export row show `Alert.alert` placeholder until the paywall screen is built.
