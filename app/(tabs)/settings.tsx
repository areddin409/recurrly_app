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

/**
 * Renders a small uppercase section heading with preset styling.
 *
 * @param title - The heading text to display
 * @returns A `Text` element styled as an uppercase, muted section label
 */

function SectionLabel({ title }: { title: string }) {
  return (
    <Text className="text-xs font-sans-bold text-muted-foreground tracking-widest uppercase mb-1.5 pl-1">
      {title}
    </Text>
  )
}

/**
 * Renders a card-styled container for grouping settings rows.
 *
 * @param children - Content to render inside the group
 * @returns A View containing `children` with card background, rounded corners, border, and overflow hidden
 */
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

/**
 * Renders a configurable settings row with an optional divider, left icon, main label, optional subtitle, and optional right-side content.
 *
 * @param iconBg - Background color for the left icon container.
 * @param icon - Icon glyph or text displayed inside the left container.
 * @param label - Main label text for the row.
 * @param subtitle - Optional secondary text shown beneath the label.
 * @param right - Optional React node rendered at the right side of the row.
 * @param onPress - Optional press handler for the row.
 * @param testID - Optional test identifier applied to the pressable.
 * @param divider - If `true`, renders a horizontal divider above the row (default: `false`).
 * @returns The rendered settings row element.
 */
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
          <Text className="text-base font-sans-semibold text-primary">{label}</Text>
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

/**
 * Renders the Settings screen with account information, grouped settings (Account, General, Plan, Data), and a sign-out control.
 *
 * The UI adapts to the user's Pro status, shows avatar/name/email, provides actions for managing the account, toggling notifications, upgrading to Pro, exporting/importing data (export gated to Pro), and signing out.
 *
 * @returns The Settings screen JSX element.
 */

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

  /**
   * Open the user's account management page in the system browser.
   *
   * Uses Clerk's `buildUserProfileUrl()` when available; otherwise falls back to
   * "https://accounts.clerk.com/user".
   */
  async function handleManageAccount() {
    const url =
      typeof (clerk as any).buildUserProfileUrl === "function"
        ? (clerk as any).buildUserProfileUrl()
        : "https://accounts.clerk.com/user"
    await WebBrowser.openBrowserAsync(url)
  }

  /**
   * Initiates user sign-out, preventing concurrent sign-out attempts.
   *
   * Sets the local signing-out state while the operation is in progress and logs any error if sign-out fails.
   */
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

  /**
   * Prompt the user with an "Upgrade to Pro" alert informing them that the Pro upgrade is coming soon.
   */
  function handleUpgradeToPro() {
    Alert.alert("Upgrade to Pro", "Pro upgrade coming soon!")
  }

  /**
   * Initiates the export-data action and displays an alert to the user.
   *
   * If the user does not have a Pro subscription, shows a "Pro Feature" alert stating that export requires Pro.
   * If the user has Pro, shows an "Export Data" alert indicating the export feature is coming soon.
   */
  function handleExportData() {
    if (!isPro) {
      Alert.alert("Pro Feature", "Export requires a Pro subscription.")
      return
    }
    Alert.alert("Export Data", "Export coming soon!")
  }

  /**
   * Prompt the user with an alert indicating CSV import is not yet available.
   *
   * Shows an alert titled "Import CSV" with the message "CSV import coming soon!".
   */
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
            className="size-14 rounded-full overflow-hidden"
          />
          <View className="flex-1 min-w-0">
            <Text
              className="text-base font-sans-bold text-primary"
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
            className="rounded-full px-4 py-1.5"
            style={{
              backgroundColor: isPro ? colors.primary : colors.accent,
            }}
          >
            <Text className="text-xs font-sans-bold text-background tracking-wider">
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
                  trackColor={{ false: colors.muted, true: colors.accent }}
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
          <Text className="flex-1 text-base font-sans-semibold text-destructive">
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
