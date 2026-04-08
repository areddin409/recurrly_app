import { tabs } from "@/constants/data"
import { colors, components } from "@/constants/theme"
import { useAuth } from "@clerk/clerk-expo"
import clsx from "clsx"
import { Redirect, Tabs } from "expo-router"
import { Image } from "@/lib/interop"
import { ImageSourcePropType, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const tabBar = components.tabBar

interface TabIconProps {
  icon: ImageSourcePropType
  focused: boolean
}

function TabIcon({ icon, focused }: TabIconProps) {
  return (
    <View className={`tabs-icon`}>
      <View className={clsx("tabs-pill", focused && "tabs-active")}>
        <Image source={icon} resizeMode="contain" className="tabs-glyph" />
      </View>
    </View>
  )
}

/**
 * Render the authenticated tab-based app layout for the `(tabs)` route group with a styled, safe-area-aware bottom tab bar.
 *
 * When authentication state is loading, the component renders `null`. If the user is not signed in, it redirects to `/(auth)/sign-in`. When authenticated, it returns a `<Tabs>` layout with a screen for each entry in `tabs` and a customized tab bar styled using theme metrics and safe-area insets.
 *
 * @returns The root `<Tabs>` element configured with a styled bottom tab bar and one screen per entry in `tabs`.
 */
export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth()
  const insets = useSafeAreaInsets()

  if (!isLoaded) return null
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: Math.max(insets.bottom, tabBar.horizontalInset),
          height: tabBar.height,
          marginHorizontal: tabBar.horizontalInset,
          borderRadius: tabBar.radius,
          paddingVertical: tabBar.itemPaddingVertical,
          backgroundColor: colors.primary,
          borderTopWidth: 0,
          elevation: 0
        },
        tabBarItemStyle: {
          paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6
        },
        tabBarIconStyle: {
          width: tabBar.iconFrame,
          height: tabBar.iconFrame,
          alignSelf: "center"
        }
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} focused={focused} />
            )
          }}
        />
      ))}
    </Tabs>
  )
}
