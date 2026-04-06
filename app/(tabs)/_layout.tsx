import { tabs } from "@/constants/data"
import { colors, components } from "@/constants/theme"
import clsx from "clsx"
import { Tabs } from "expo-router"
import { Image, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const tabBar = components.tabBar

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  function TabIcon({ icon, focused }: TabIconProps) {
    return (
      <View className={`tabs-icon`}>
        <View className={clsx("tabs-pill", focused && "tabs-active")}>
          <Image source={icon} resizeMode="contain" className="tabs-glyph" />
        </View>
      </View>
    )
  }
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
