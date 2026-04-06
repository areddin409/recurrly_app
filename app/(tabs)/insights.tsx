import { SafeAreaView } from "@/lib/interop"
import { Text } from "react-native"

/**
 * Render the Insights screen UI.
 *
 * Displays a SafeAreaView containing a heading labeled "Insights" with the app's layout and typography classes.
 *
 * @returns A JSX element representing the Insights screen
 */
export default function Insights() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Insights</Text>
    </SafeAreaView>
  )
}
