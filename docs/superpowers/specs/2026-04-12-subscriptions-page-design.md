# Recurrly — Subscriptions Page & Add/Edit Sheet Design
**Date:** 2026-04-12
**Scope:** `app/(tabs)/subscriptions.tsx` (list screen) + `components/AddEditSheet.tsx` (bottom sheet form)

---

## Overview

The Subscriptions page is the primary management screen for a user's recurring subscriptions. It displays all subscriptions with status filtering, uses the same expandable card pattern as the Home screen for consistency, and provides a bottom sheet form for adding and editing subscriptions.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Filter controls | Equal-width chips (no scroll) | 4 options fit in one row; no scroll needed |
| Add/Edit UX | Bottom sheet modal | Consistent with existing `PaywallModal` pattern |
| Card interaction | Expand in place (same as Home) | Consistency — same `SubscriptionCard` component, same gesture |
| Edit entry point | "Edit" button inside expanded card | Keeps management on the subscriptions tab |
| Edit/Add route | Component-level sheet, not a separate route | Simpler; avoids route for what is a sheet overlay |

---

## Screen: `app/(tabs)/subscriptions.tsx`

### Header
- Title: "My Subscriptions" (`text-2xl font-sans-bold text-primary`)
- Right side: `⋯` overflow button (`icon-btn` style) — opens an `ActionSheet` with sort options:
  - Sort by Name (A–Z)
  - Sort by Amount (high to low)
  - Sort by Date (soonest first)
- No back chevron — this is a root tab screen

### Filter Chips
Below the header, a row of four equal-width chips:

```
[ All ]  [ Active ]  [ Paused ]  [ Cancelled ]
```

- Uses `flex-row` with each chip set to `flex-1`
- Active chip: `bg-accent border-accent text-white`
- Inactive chip: `bg-background border-border text-muted-foreground`
- Tapping a chip filters the list client-side (no Convex re-query — filter applied to the already-loaded `getAll` result)
- Default filter: **All**

### Subscription List
- `FlatList` of `SubscriptionCard` — same component used on the Home screen
- Same expand-in-place behavior: tapping a card toggles `expandedId` state
- **One addition vs. Home:** the expanded card body includes a context-aware action button (full-width, `bg-primary` style matching the existing `.sub-cancel` button) whose label and behaviour depend on the subscription's status:
  - **Active** → "Edit" — opens `AddEditSheet` pre-filled for editing
  - **Paused** → "Resume" — fires the `update` mutation directly (sets `status: "active"`), no sheet needed
  - **Cancelled** → "Remove" — shows a confirmation `Alert`, then fires the `remove` mutation on confirm
- `ItemSeparatorComponent`: `h-4` spacer (same as Home)
- `contentContainerStyle`: `paddingBottom` accounts for tab bar height + FAB clearance

### Upsell Card (free users only)
- Shown after the 3rd card in the list (or as the last item if fewer than 3 subscriptions)
- Hidden for Pro users (`isPro` from `useEntitlement()`)
- Style: teal accent border (`border-subscription`), cream background
- Content: "✦ Unlock Pro Insights" title, "Charts, spending history & export" subtitle, "Upgrade" CTA button (`bg-primary text-background rounded-full`)
- Tapping "Upgrade" opens `PaywallModal`

### Empty State
- Shown when the filtered list is empty
- Text: "No subscriptions yet. Tap + to add one." (`home-empty-state` class)
- If a non-"All" filter is active and empty: "No [status] subscriptions."

### FAB
- Coral circle (`bg-accent`), `+` icon, fixed bottom-right
- Position: `absolute bottom-6 right-5`
- Shadow: `shadow-lg` with coral tint
- Tapping opens `AddEditSheet` in add mode (no subscription prop)

---

## Component: `components/AddEditSheet.tsx`

### Props

```typescript
type AddEditSheetProps = {
  visible: boolean
  onClose: () => void
  subscription?: {
    _id: Id<"subscriptions">
    name: string
    amount: number
    currency: string
    billingCycle: "weekly" | "monthly" | "yearly"
    nextBillingDate: number
    status: "active" | "paused" | "cancelled"
    category?: string
    paymentMethod?: string
    startDate?: number
    notes?: string
  }
}
```

If `subscription` is provided → **edit mode**. Otherwise → **add mode**.

### Shell
- Uses `Modal` from React Native with `transparent` + `animationType="slide"`
- Overlay: `modal-overlay` (semi-transparent dark background)
- Sheet: `modal-container` (rounded-t-3xl, max-h-[85%], cream background)
- Drag handle bar at top (4px wide, centered)
- `KeyboardAvoidingView` wraps the sheet so the keyboard doesn't cover inputs
- `ScrollView` inside the sheet body for long forms

### Header
- Uses `modal-header` class
- Title: "Add Subscription" or "Edit Subscription" (`modal-title`)
- Close button: `✕` in a circle (`modal-close` / `modal-close-text`)

### Form Sections

#### Required Fields
| Field | Control | Notes |
|---|---|---|
| Name | `TextInput` | Placeholder: "e.g. Netflix" |
| Amount | `TextInput` (numeric keyboard) | Placeholder: "0.00" |
| Currency | `TextInput` | Defaults to "USD"; 3-char uppercase |
| Billing Cycle | Segmented picker (3 options) | Weekly / Monthly / Yearly; uses `picker-row` / `picker-option` classes |
| Next Billing Date | `DateTimePicker` (date mode) | Defaults to today + 1 month |

Amount and Currency sit in the same row (`flex-row gap-3`): Amount takes `flex-1`, Currency is fixed at `w-20`.

#### Optional Fields
Shown below a section label "Optional" (`auth-wordmark-sub` style for the label).

| Field | Control | Notes |
|---|---|---|
| Category | Chip picker | Preset chips: Entertainment, Productivity, Storage, Gaming, Health, Other. Plus a custom text input that appears when "Other" is selected. Uses `category-scroll` / `category-chip` / `category-chip-active` classes. |
| Payment Method | `TextInput` | Placeholder: "e.g. Visa ending in 4242" |
| Start Date | `DateTimePicker` (date mode) | Optional; placeholder row with a "Set" link if not set |
| Notes | `TextInput` multiline | Placeholder: "Optional notes..." |

#### Edit-Only Fields
Shown only when `subscription` prop is present:

| Field | Control | Notes |
|---|---|---|
| Status | Segmented picker (3 options) | Active / Paused / Cancelled; same `picker-row` / `picker-option` style |

### Actions

**Add mode:**
- Single coral button: "Add Subscription" (`auth-button` / `auth-button-text` classes)

**Edit mode:**
- Primary coral button: "Save Changes"
- Below it: "Delete Subscription" — text-only destructive button (`text-destructive font-sans-bold`) — tapping shows a confirmation `Alert` before calling the `remove` mutation

### Convex Mutations Called
- Add: `api.subscriptions.create` — passes all form fields; `accentColor` auto-assigned by cycling through `[#99B7DD, #F7D44C, #8BCBB8]` based on current subscription count mod 3
- Edit: `api.subscriptions.update` — passes `_id` + changed fields
- Delete: `api.subscriptions.remove` — passes `_id`

### Validation
- `name` must be non-empty
- `amount` must be a positive number
- `nextBillingDate` must be a valid date
- All other fields optional
- Errors shown inline below the relevant field using `auth-error` class
- Save button disabled (`auth-button-disabled`) while submitting

---

## File Changes

| File | Action |
|---|---|
| `app/(tabs)/subscriptions.tsx` | Replace stub — full list screen |
| `components/AddEditSheet.tsx` | Create new — bottom sheet form |
| `app/subscriptions/[id].tsx` | Delete — edit is handled by `AddEditSheet`, this stub is no longer needed |

---

## What Is NOT In Scope

- `iconUrl` — field exists in schema, not surfaced in v1 form. Cards show a placeholder until a future image-picker feature is added.
- Multi-currency display — `currency` is stored but display conversion is a Pro v2 feature.
- Swipe-to-delete — not in v1; deletion is via the Edit sheet.
- Drag-to-reorder — not in v1; order is controlled by sort menu.
