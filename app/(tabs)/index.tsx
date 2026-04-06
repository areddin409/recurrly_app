import "@/global.css"
import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background   p-5">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      <Link
        href="/onboarding"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        <Text>Go to Onboarding</Text>
      </Link>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        <Text>Go to Sign In</Text>
      </Link>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        <Text>Go to Sign Up</Text>
      </Link>

      <Link
        href="/subscriptions/spotify"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        <Text>Spotify Subscription</Text>
      </Link>
    </SafeAreaView>
  )
}
