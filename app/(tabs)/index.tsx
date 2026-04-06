import "@/global.css"
import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

/**
 * Renders the app's home screen with a header and navigation links for onboarding, sign-in, sign-up, and Spotify subscription.
 *
 * @returns The root React element for the home screen layout.
 */
export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background   p-5">
      <Text className="text-5xl font-sans-extrabold ">Home</Text>
      <Link
        href="/onboarding"
        className="mt-4 font-sans-bold rounded bg-primary text-white p-4"
      >
        <Text>Go to Onboarding</Text>
      </Link>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 font-sans-bold rounded bg-primary text-white p-4"
      >
        <Text>Go to Sign In</Text>
      </Link>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 font-sans-bold rounded bg-primary text-white p-4"
      >
        <Text>Go to Sign Up</Text>
      </Link>
    </SafeAreaView>
  )
}
