import "../global.css"

import { Stack } from "expo-router"
import "react-native-reanimated"

import { useColorScheme } from "@/hooks/use-color-scheme"

export const unstable_settings = {
  anchor: "(tabs)"
}

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff"
          }
        }}
      />
    </Stack>
  )
}
