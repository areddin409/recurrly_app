import { useClerk } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { useEffect } from "react"
import { Modal, Pressable, Text, View } from "react-native"

type PaywallModalProps = {
  visible: boolean
  onDismiss: () => void
}

const FEATURES = [
  { label: "Monthly Insights & spending trends", icon: "📊" },
  { label: "Full spending history", icon: "🕐" },
  { label: "Export to CSV / JSON", icon: "📤" },
  { label: "Multi-currency display", icon: "💱" },
]

const SHEET_OFF = 900

export default function PaywallModal({ visible, onDismiss }: PaywallModalProps) {
  const clerk = useClerk()
  const translateY = useSharedValue(SHEET_OFF)

  useEffect(() => {
    if (visible) {
      translateY.value = SHEET_OFF
      translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) })
    } else {
      translateY.value = SHEET_OFF
    }
  }, [visible])

  function animateDismiss() {
    translateY.value = withTiming(SHEET_OFF, { duration: 280 }, () => {
      scheduleOnRN(onDismiss)
    })
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY)
    })
    .onEnd((e) => {
      if (e.translationY > 80) {
        translateY.value = withTiming(SHEET_OFF, { duration: 250 }, () => {
          scheduleOnRN(onDismiss)
        })
      } else {
        translateY.value = withSpring(0)
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  async function handleUpgrade() {
    const url = process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL
    if (!url) return
    await WebBrowser.openBrowserAsync(url)
    await clerk.session?.reload()
    animateDismiss()
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={animateDismiss}
    >
      <View className="modal-overlay">
        <GestureHandlerRootView>
          <GestureDetector gesture={pan}>
            <Animated.View className="modal-container" style={sheetStyle}>
          {/* Drag handle */}
          <View className="items-center pt-3 pb-1">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>

          {/* Hero */}
          <View className="mx-5 mt-4 mb-5 rounded-3xl bg-primary px-6 pt-8 pb-7 overflow-hidden">
            {/* Logo mark */}
            <View className="mb-4 flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-xl bg-accent">
                <Text className="text-lg font-sans-extrabold text-background">R</Text>
              </View>
              <View>
                <Text className="text-base font-sans-extrabold text-background">Recurrly</Text>
                <View className="mt-0.5 self-start rounded-full bg-accent px-2 py-0.5">
                  <Text className="text-[10px] font-sans-bold uppercase tracking-widest text-background">
                    Pro
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-2xl font-sans-extrabold text-background leading-tight">
              Gain deeper{"\n"}financial clarity.
            </Text>
            <Text className="mt-2 text-sm font-sans-medium text-background/60">
              Everything you need to stay on top of your spending.
            </Text>
          </View>

          {/* Features */}
          <View className="px-5 gap-3">
            {FEATURES.map((feature) => (
              <View key={feature.label} className="flex-row items-center gap-3">
                <View className="size-9 items-center justify-center rounded-xl bg-muted">
                  <Text className="text-base">{feature.icon}</Text>
                </View>
                <Text className="flex-1 text-sm font-sans-semibold text-primary">
                  {feature.label}
                </Text>
                <View className="size-5 items-center justify-center rounded-full bg-accent">
                  <Text className="text-[10px] font-sans-bold text-background">✓</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing pills */}
          <View className="mx-5 mt-5 flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-border bg-muted px-4 py-3 items-center">
              <Text className="text-[11px] font-sans-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Monthly
              </Text>
              <Text className="text-xl font-sans-extrabold text-primary">$4.99</Text>
              <Text className="text-[11px] font-sans-medium text-muted-foreground">/ month</Text>
            </View>
            <View className="flex-1 rounded-2xl border-2 border-accent bg-accent/10 px-4 py-3 items-center">
              <View className="absolute -top-2.5 self-center rounded-full bg-accent px-2.5 py-0.5">
                <Text className="text-[9px] font-sans-bold uppercase tracking-widest text-background">
                  Best value
                </Text>
              </View>
              <Text className="text-[11px] font-sans-semibold uppercase tracking-widest text-accent mb-1">
                Yearly
              </Text>
              <Text className="text-xl font-sans-extrabold text-primary">$39.99</Text>
              <Text className="text-[11px] font-sans-medium text-muted-foreground">/ year</Text>
            </View>
          </View>

          {/* CTAs */}
          <View className="px-5 pt-4 pb-8 gap-3">
            <Pressable
              testID="paywall-upgrade-btn"
              onPress={handleUpgrade}
              className="bg-accent rounded-2xl py-4 items-center active:opacity-80"
            >
              <Text className="text-base font-sans-bold text-background">
                Upgrade to Pro
              </Text>
            </Pressable>
            <Pressable
              testID="paywall-dismiss-btn"
              onPress={animateDismiss}
              className="items-center py-2"
            >
              <Text className="text-sm font-sans-medium text-muted-foreground">
                Maybe later
              </Text>
            </Pressable>
          </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      </View>
    </Modal>
  )
}
