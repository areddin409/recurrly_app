import { tabs } from "@/constants/data"
import clsx from "clsx"
import { Tabs } from "expo-router"
import { Image, ImageSourcePropType, View } from "react-native"

interface TabIconProps {
  icon: ImageSourcePropType
  focused: boolean
}

function TabIcon({ icon, focused }: TabIconProps) {
  return (
    <View className={`tabs-icon`}>
      <View className={clsx("tabs-pill", focused && "bg-active")}>
        <Image source={icon} className="tabs-glyph" />
      </View>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false
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
