import { useLocalSearchParams, useRouter } from "expo-router"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"

const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string | string[] }>()
  const router = useRouter()

  return (
    <View>
      <Text>SubscriptionDetails: {id}</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>Go back</Text>
      </TouchableOpacity>
    </View>
  )
}

export default SubscriptionDetails
