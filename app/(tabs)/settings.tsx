import { SafeAreaView } from "@/lib/interop"
import { useAuth } from "@clerk/clerk-expo"
import { Pressable, Text, View } from "react-native"

/**
 * Renders the Settings screen with a heading and a bottom-aligned Sign Out action.
 *
 * The screen is wrapped in a safe-area layout and displays a "Settings" heading.
 * It includes a "Sign Out" button that invokes the authentication `signOut` action when pressed; any error from sign-out is logged to the console.
 *
 * @returns The React element tree for the Settings screen (a SafeAreaView containing the heading and the Sign Out control).
 */
export default function Settings() {
  const { signOut } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary mb-6">Settings</Text>

      <View className="mt-auto mb-24">
        <Pressable
          onPress={async () => {
            try {
              await signOut()
            } catch (err) {
              console.error("Sign out failed", err)
            }
          }}
          className="bg-red-500 p-4 rounded-lg active:opacity-80"
        >
          <Text className="text-white text-center font-sans-semibold text-base">
            Sign Out
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
