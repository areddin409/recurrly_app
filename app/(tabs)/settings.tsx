import { SafeAreaView } from "@/lib/interop"
import { useAuth } from "@clerk/clerk-expo"
import { useState } from "react"
import { Pressable, Text, View } from "react-native"

/**
 * Render the Settings screen with a sign-out control.
 *
 * The screen shows a "Settings" header and a bottom-aligned sign-out button. Tapping the button triggers the authenticated sign-out flow, disables the button while sign-out is in progress, updates the button label to "Signing Out…", and restores the button state when finished. If sign-out fails, the error is logged to the console.
 *
 * @returns The rendered Settings screen element
 */
export default function Settings() {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary mb-6">Settings</Text>

      <View className="mt-auto mb-24">
        <Pressable
          disabled={isSigningOut}
          onPress={async () => {
            if (isSigningOut) return
            setIsSigningOut(true)
            try {
              await signOut()
            } catch (err) {
              console.error("Sign out failed", err)
            } finally {
              setIsSigningOut(false)
            }
          }}
          className={`bg-red-500 p-4 rounded-lg ${isSigningOut ? "opacity-50" : "active:opacity-80"}`}
        >
          <Text className="text-white text-center font-sans-semibold text-base">
            {isSigningOut ? "Signing Out…" : "Sign Out"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
