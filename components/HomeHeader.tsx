import BalanceCard from "@/components/BalanceCard"
import ListHeading from "@/components/ListHeading"
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard"
import { HOME_USER, UPCOMING_SUBSCRIPTIONS } from "@/constants/data"
import { icons } from "@/constants/icons"
import images from "@/constants/images"
import { Image, ScrollView, Text, View } from "react-native"

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
        {UPCOMING_SUBSCRIPTIONS.length === 0 ? (
          <Text className="home-empty-state">No upcoming renewals yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {UPCOMING_SUBSCRIPTIONS.map((item) => (
              <UpcomingSubscriptionCard key={item.id} {...item} />
            ))}
          </ScrollView>
        )}
      </View>

      <ListHeading title="All Subscriptions" />
    </>
  )
}
