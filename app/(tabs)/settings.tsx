import { SafeAreaView } from "@/lib/interop"
import { Text } from "react-native"

/**
 * Renders the Settings screen using a safe-area layout and displays a styled "Settings" heading.
 *
 * @returns The React element tree: a SafeAreaView containing a styled `Text` node with the label "Settings".
 */
export default function Settings() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Settings</Text>
    </SafeAreaView>
  )
}
