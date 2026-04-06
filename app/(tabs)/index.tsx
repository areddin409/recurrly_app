import HomeHeader from "@/components/HomeHeader"
import SubscriptionCard from "@/components/SubscriptionCard"
import { HOME_SUBSCRIPTIONS } from "@/constants/data"
import { components } from "@/constants/theme"
import "@/global.css"
import { SafeAreaView } from "@/lib/interop"
import { useState } from "react"
import { FlatList, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function App() {
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null)
  const insets = useSafeAreaInsets()
  const { tabBar } = components
  const bottomPadding =
    Math.max(insets.bottom, tabBar.horizontalInset) + tabBar.height / 2

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id
              )
            }
          />
        )}
        extraData={expandedSubscriptionId}
        ListHeaderComponent={<HomeHeader />}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions added yet.</Text>
        }
      />
    </SafeAreaView>
  )
}
