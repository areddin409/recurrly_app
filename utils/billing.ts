type BillingCycle = "weekly" | "monthly" | "yearly"

/**
 * Convert an amount expressed in a given billing cycle to its equivalent monthly amount.
 *
 * @param amount - The monetary value in the original billing cycle
 * @param cycle - The billing cycle of `amount` (`"weekly"`, `"monthly"`, or `"yearly"`)
 * @returns The value of `amount` expressed as a monthly amount
 */
export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  if (cycle === "monthly") return amount
  if (cycle === "weekly") return amount * 4.33
  return amount / 12
}

/**
 * Calculates the total monthly-equivalent spend for a list of subscriptions.
 *
 * @param subs - Array of subscription objects, each with `amount` and `billingCycle`
 * @returns The sum of all subscription amounts converted to their monthly equivalents
 */
export function totalMonthlySpend(
  subs: { amount: number; billingCycle: BillingCycle }[]
): number {
  return subs.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0)
}

/**
 * Compute the number of whole days from now until a target timestamp.
 *
 * @param timestampMs - Target time as milliseconds since the Unix epoch
 * @returns `0` if the timestamp is in the past or present, otherwise the number of days until the timestamp (rounded up)
 */
export function daysUntil(timestampMs: number): number {
  const diff = timestampMs - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

/**
 * Converts a billing cycle to its representative number of days.
 *
 * @param cycle - The billing cycle to convert (`"weekly"`, `"monthly"`, or `"yearly"`)
 * @returns `7` for `"weekly"`, `30` for `"monthly"`, `365` for `"yearly"`
 */
export function cycleToDays(cycle: BillingCycle): number {
  if (cycle === "weekly") return 7
  if (cycle === "monthly") return 30
  return 365
}
