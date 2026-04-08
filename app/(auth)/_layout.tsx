import { useAuth } from "@clerk/clerk-expo"
import { Redirect, Stack } from "expo-router"

/**
 * Render an authentication-aware layout that redirects authenticated users and shows the unauthenticated route stack.
 *
 * Renders nothing while authentication state is loading. If the user is signed in, navigates to "/(tabs)". If not signed in, renders a Stack navigator with headers hidden for unauthenticated screens.
 *
 * @returns A `Redirect` to "/(tabs)" for signed-in users, `null` while auth state is loading, or a `Stack` navigator with `headerShown: false` for unauthenticated users.
 */
export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  if (isSignedIn) return <Redirect href="/(tabs)" />

  return <Stack screenOptions={{ headerShown: false }} />
}
