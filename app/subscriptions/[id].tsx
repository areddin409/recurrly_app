import { SafeAreaView } from "@/lib/interop"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Text, TouchableOpacity } from "react-native"

/**
 * Screen component that displays a subscription identifier and provides a control to navigate back.
 *
 * Renders the current route `id` and a touchable "Go back" control that navigates to the previous screen.
 *
 * @returns A React element rendering the subscription details screen
 */
export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>()
  const router = useRouter()

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Subscription: {id}</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-accent">Go back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
