import { HOME_BALANCE } from "@/constants/data"
import { formatCurrency } from "@/lib/utils"
import dayjs from "dayjs"
import { Text, View } from "react-native"

export default function BalanceCard() {
  return (
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
  )
}
