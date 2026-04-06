import { SafeAreaView } from "@/lib/interop"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Text, TouchableOpacity } from "react-native"

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
