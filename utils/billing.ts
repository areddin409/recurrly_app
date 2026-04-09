type BillingCycle = "weekly" | "monthly" | "yearly"

export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  if (cycle === "monthly") return amount
  if (cycle === "weekly") return amount * 4.33
  return amount / 12
}

export function totalMonthlySpend(
  subs: { amount: number; billingCycle: BillingCycle }[]
): number {
  return subs.reduce((sum, s) => sum + toMonthlyAmount(s.amount, s.billingCycle), 0)
}

export function daysUntil(timestampMs: number): number {
  const diff = timestampMs - Date.now()
  if (diff <= 0) return 0
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

export function cycleToDays(cycle: BillingCycle): number {
  if (cycle === "weekly") return 7
  if (cycle === "monthly") return 30
  return 365
}
