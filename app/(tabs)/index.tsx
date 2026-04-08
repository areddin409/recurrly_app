import HomeHeader from "@/components/HomeHeader"
import SubscriptionCard from "@/components/SubscriptionCard"
import { HOME_SUBSCRIPTIONS } from "@/constants/data"
import { components } from "@/constants/theme"
import { SafeAreaView } from "@/lib/interop"
import { useCallback, useState } from "react"
import { FlatList, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import "@/global.css"

/**
 * Renders a fixed-height spacer used between subscription items.
 *
 * @returns A React element that is a spacer with height `h-4`
 */
function SubscriptionSeparator() {
  return <View className="h-4" />
}

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null)
  const insets = useSafeAreaInsets()
  const { tabBar } = components
  const bottomPadding =
    Math.max(insets.bottom, tabBar.horizontalInset) + tabBar.height

  const renderItem = useCallback(
    ({ item }: { item: (typeof HOME_SUBSCRIPTIONS)[number] }) => (
      <SubscriptionCard
        {...item}
        expanded={expandedSubscriptionId === item.id}
        onPress={() =>
          setExpandedSubscriptionId((currentId) =>
            currentId === item.id ? null : item.id
          )
        }
      />
    ),
    [expandedSubscriptionId]
  )

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={expandedSubscriptionId}
        ListHeaderComponent={HomeHeader}
        ItemSeparatorComponent={SubscriptionSeparator}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions added yet.</Text>
        }
      />
    </SafeAreaView>
  )
}
