import { render, screen } from "@testing-library/react-native"
import React from "react"
import Insights from "../app/(tabs)/insights"

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}))

jest.mock("../components/PaywallModal", () => {
  const { Pressable } = require("react-native")
  return function MockPaywallModal({
    visible,
  }: {
    visible: boolean
    onDismiss: () => void
  }) {
    if (!visible) return null
    return <Pressable testID="paywall-upgrade-btn" onPress={jest.fn()} />
  }
})

jest.mock("@/lib/interop", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}))

import { useAuth } from "@clerk/clerk-expo"

function setupClerk({ isPro = false } = {}) {
  ;(useAuth as jest.Mock).mockReturnValue({
    has: ({ feature }: { feature: string }) =>
      feature === "pro" ? isPro : false,
  })
}

describe("Insights — paywall gating", () => {
  it("shows paywall modal for free users", () => {
    setupClerk({ isPro: false })
    render(<Insights />)
    expect(screen.getByTestId("paywall-upgrade-btn")).toBeTruthy()
  })

  it("does not show paywall for pro users", () => {
    setupClerk({ isPro: true })
    render(<Insights />)
    expect(screen.queryByTestId("paywall-upgrade-btn")).toBeNull()
  })

  it("renders screen content for pro users", () => {
    setupClerk({ isPro: true })
    render(<Insights />)
    expect(screen.getByText("Insights")).toBeTruthy()
  })
})
