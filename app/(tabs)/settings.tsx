import { SafeAreaView } from "@/lib/interop"
import { useAuth } from "@clerk/clerk-expo"
import { Pressable, Text, View } from "react-native"

/**
 * Renders the Settings screen using a safe-area layout and displays a styled "Settings" heading.
 *
 * @returns The React element tree: a SafeAreaView containing a styled `Text` node with the label "Settings".
 */
export default function Settings() {
  const { signOut } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary mb-6">Settings</Text>

      <View className="mt-auto mb-24">
        <Pressable
          onPress={() => signOut()}
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
