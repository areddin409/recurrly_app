import { icons } from "@/constants/icons"
import { useSSO } from "@clerk/clerk-expo"
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"
import { useCallback } from "react"
import { Image, Text, TouchableOpacity, View } from "react-native"

WebBrowser.maybeCompleteAuthSession()

/**
 * Renders a button that initiates an OAuth SSO flow for the given provider.
 *
 * @param strategy - The OAuth strategy to use: `"oauth_google"` or `"oauth_github"`.
 * @param label - The text displayed inside the button.
 * @param iconContent - The icon node displayed to the left of the label.
 * @returns A touchable button that starts the configured SSO flow when pressed.
 */
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
      const redirectUrl = Linking.createURL("/")
      const { createdSessionId, setActive } = await startSSOFlow({ strategy, redirectUrl })
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

/**
 * Renders two single sign-on buttons for Google and GitHub.
 *
 * @returns A React element containing two SSO buttons stacked vertically with spacing.
 */
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
