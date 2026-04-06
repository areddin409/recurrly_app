import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

/**
 * Render the Sign Up screen.
 *
 * Renders a SafeAreaView containing a styled "Sign Up" title and a link to the sign-in route.
 *
 * @returns A React element representing the Sign Up screen with a title and a navigation link to sign in.
 */
export default function SignUp() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Sign Up</Text>
      <Link href="/(auth)/sign-in">Already have an account? Sign In</Link>
    </SafeAreaView>
  )
}
