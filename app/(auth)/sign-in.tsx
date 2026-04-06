import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

export default function SignIn() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Sign In</Text>
      <Link href="/(auth)/sign-up">Create Account</Link>
    </SafeAreaView>
  )
}
