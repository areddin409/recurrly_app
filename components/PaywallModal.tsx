import { useClerk } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import { Modal, Pressable, Text, View } from "react-native"

type PaywallModalProps = {
  visible: boolean
  onDismiss: () => void
}

const FEATURES = [
  "Monthly Insights & spending trends",
  "Full spending history",
  "Export to CSV / JSON",
  "Multi-currency display",
]

export default function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const clerk = useClerk()

  async function handleUpgrade() {
    await WebBrowser.openBrowserAsync(
      process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL!
    )
    await clerk.session?.reload()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View className="flex-1 bg-background">
        {/* Close button */}
        <Pressable
          testID="paywall-close-btn"
          onPress={onDismiss}
          className="absolute top-12 right-5 z-10 p-2"
        >
          <Text className="text-2xl font-sans-bold text-primary">×</Text>
        </Pressable>

        {/* Header */}
        <View className="bg-accent pt-16 pb-10 px-6 items-center">
          <Text className="text-3xl font-sans-bold text-background mb-2">
            Recurrly Pro
          </Text>
          <Text className="text-base font-sans-medium text-background opacity-80">
            Unlock everything
          </Text>
        </View>

        {/* Feature list */}
        <View className="flex-1 px-6 pt-8">
          {FEATURES.map((feature) => (
            <View key={feature} className="flex-row items-center gap-3 mb-4">
              <Text className="text-accent text-lg font-sans-bold">✓</Text>
              <Text className="text-base font-sans-medium text-primary">
                {feature}
              </Text>
            </View>
          ))}

          {/* Pricing */}
          <View className="mt-6 items-center">
            <Text className="text-sm font-sans-medium text-muted-foreground">
              <Text className="font-sans-bold text-primary">$4.99</Text>
              /month or{" "}
              <Text className="font-sans-bold text-primary">$39.99</Text>
              /year
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View className="px-6 pb-10 gap-3">
          <Pressable
            testID="paywall-upgrade-btn"
            onPress={handleUpgrade}
            className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
          >
            <Text className="text-base font-sans-bold text-background">
              Upgrade Now
            </Text>
          </Pressable>
          <Pressable
            testID="paywall-dismiss-btn"
            onPress={onDismiss}
            className="items-center py-2"
          >
            <Text className="text-sm font-sans-medium text-muted-foreground">
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
