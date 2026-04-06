import { SafeAreaView } from "@/lib/interop"
import { Text } from "react-native"

/**
 * Renders the Subscriptions screen UI.
 *
 * @returns A React element containing a SafeAreaView with a styled "Subscriptions" title.
 */
export default function Subscriptions() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Subscriptions</Text>
    </SafeAreaView>
  )
}
