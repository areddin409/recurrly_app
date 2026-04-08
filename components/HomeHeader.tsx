import BalanceCard from "@/components/BalanceCard"
import ListHeading from "@/components/ListHeading"
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard"
import { UPCOMING_SUBSCRIPTIONS } from "@/constants/data"
import { icons } from "@/constants/icons"
import images from "@/constants/images"
import { useUser } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { Image } from "@/lib/interop"
import { FlatList, Pressable, Text, View } from "react-native"

/**
 * Renders the home screen header UI including the user identity area, balance card, upcoming subscriptions carousel, and an "All Subscriptions" heading.
 *
 * The user area is tappable and navigates to the settings route; it displays the user's avatar (falls back to a local avatar) and the user's first name, the local-part of their first email, or "User" if neither is available. The upcoming section displays `UPCOMING_SUBSCRIPTIONS` in a horizontal list and shows an empty-state message when there are no items.
 *
 * @returns The composed JSX element for the home header and its related sections.
 */
export default function HomeHeader() {
  const { user } = useUser()
  const router = useRouter()

  return (
    <>
      <View className="home-header">
        <Pressable
          className="home-user"
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Image
            source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
            className="home-avatar"
          />
          <Text className="home-user-name">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "User"}
          </Text>
        </Pressable>
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
