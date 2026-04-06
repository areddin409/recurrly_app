import "@/global.css"

import { Stack } from "expo-router"
import "react-native-reanimated"

import { useColorScheme } from "@/hooks/use-color-scheme"

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return <Stack screenOptions={{ headerShown: false }} />
}
