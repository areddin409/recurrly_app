import "@/global.css"

import { ClerkProvider } from "@clerk/clerk-expo"
import { tokenCache } from "@clerk/clerk-expo/token-cache"
import { useFonts } from "expo-font"
import { SplashScreen, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"

import "react-native-reanimated"

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env.local")
}

SplashScreen.preventAutoHideAsync()

/**
 * Root app layout that loads fonts, manages the splash screen lifecycle, and provides authentication and navigation context.
 *
 * The component waits for app fonts to load before rendering. While fonts are loading it renders `null`; once loaded it hides the splash screen and renders the app wrapped with Clerk authentication and the navigation stack.
 *
 * @returns The rendered layout: `ClerkProvider` containing a status bar and the app `Stack` when fonts are loaded, or `null` while fonts are loading.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf")
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ClerkProvider>
  )
}
