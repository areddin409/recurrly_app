import { SafeAreaView } from "@/lib/interop"
import { Text } from "react-native"

export default function Onboarding() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Onboarding</Text>
    </SafeAreaView>
  )
}
