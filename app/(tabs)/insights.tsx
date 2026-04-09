import { SafeAreaView } from "@/lib/interop"
import PaywallModal from "@/components/PaywallModal"
import { useAuth } from "@clerk/clerk-expo"
import { useState } from "react"
import { Text } from "react-native"

export default function Insights() {
  const { has } = useAuth()
  const isPro = has?.({ feature: "pro" }) ?? false
  const [paywallVisible, setPaywallVisible] = useState(!isPro)

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Insights</Text>
      <PaywallModal
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
      />
    </SafeAreaView>
  )
}
