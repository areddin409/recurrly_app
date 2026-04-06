import ListHeading from "@/components/ListHeading"
import SubscriptionCard from "@/components/SubscriptionCard"
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard"
import {
  HOME_BALANCE,
  HOME_SUBSCRIPTIONS,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS
} from "@/constants/data"
import { icons } from "@/constants/icons"
import images from "@/constants/images"
import { components } from "@/constants/theme"
import "@/global.css"
import { SafeAreaView } from "@/lib/interop"
import { formatCurrency } from "@/lib/utils"
import dayjs from "dayjs"
import { useState } from "react"
import { FlatList, Image, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function HomeHeader() {
  return (
    <>
      <View className="home-header">
        <View className="home-user">
          <Image source={images.avatar} className="home-avatar" />
          <Text className="home-user-name">{HOME_USER.name}</Text>
        </View>
        <View className="home-add-icon">
          <Image source={icons.add} className="home-add-glyph" />
        </View>
      </View>

      <View className="home-balance-card">
        <Text className="home-balance-label">Balance</Text>
        <View className="home-balance-row">
          <Text className="home-balance-amount">
            {formatCurrency(HOME_BALANCE.amount)}
          </Text>
          <Text className="home-balance-date">
            {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
          </Text>
        </View>
      </View>

      <View>
        <ListHeading title="Upcoming" />
        <FlatList
          data={UPCOMING_SUBSCRIPTIONS}
          renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={
            <Text className="home-empty-state">No upcoming renewals yet.</Text>
          }
        />
      </View>

      <ListHeading title="All Subscriptions" />
    </>
  )
}

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
