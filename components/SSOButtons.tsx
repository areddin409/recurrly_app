import { icons } from "@/constants/icons"
import { useSSO } from "@clerk/clerk-expo"
import * as WebBrowser from "expo-web-browser"
import { useCallback } from "react"
import { Image, Text, TouchableOpacity, View } from "react-native"

WebBrowser.maybeCompleteAuthSession()

function SSOButton({
  strategy,
  label,
  iconContent
}: {
  strategy: "oauth_google" | "oauth_github"
  label: string
  iconContent: React.ReactNode
}) {
  const { startSSOFlow } = useSSO()

  const handlePress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
      }
    } catch (err) {
      console.error("SSO error", err)
    }
  }, [strategy, startSSOFlow])

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center justify-center gap-2.5 border border-border rounded-2xl py-3.5 bg-white"
    >
      {iconContent}
      <Text className="font-sans-semibold text-primary text-[15px]">
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export default function SSOButtons() {
  return (
    <View className="gap-3">
      <SSOButton
        strategy="oauth_google"
        label="Continue with Google"
        iconContent={
          <Image
            source={icons.google}
            className="size-5"
            resizeMode="contain"
          />
        }
      />
      <SSOButton
        strategy="oauth_github"
        label="Continue with GitHub"
        iconContent={
          <Image
            source={icons.github}
            className="size-5"
            style={{ tintColor: "#081126" }}
            resizeMode="contain"
          />
        }
      />
    </View>
  )
}
