import { SafeAreaView } from "@/lib/interop"
import { Link } from "expo-router"
import { Text } from "react-native"

export default function SignUp() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Sign Up</Text>
      <Link href="/(auth)/sign-in">Already have an account? Sign In</Link>
    </SafeAreaView>
  )
}
