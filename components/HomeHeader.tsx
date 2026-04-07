import BalanceCard from "@/components/BalanceCard"
import ListHeading from "@/components/ListHeading"
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard"
import { HOME_USER, UPCOMING_SUBSCRIPTIONS } from "@/constants/data"
import { icons } from "@/constants/icons"
import images from "@/constants/images"
import { FlatList, Image, Text, View } from "react-native"

export default function HomeHeader() {
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

      <BalanceCard />

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
