import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

/**
 * Render the Sign In screen.
 *
 * Displays a safe-area container with a "Sign In" heading and a link to the sign-up route.
 *
 * @returns The JSX element for the Sign In screen
 */
export default function SignIn() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Sign In</Text>
      <Link href="/(auth)/sign-up">Create Account</Link>
    </SafeAreaView>
  )
}
