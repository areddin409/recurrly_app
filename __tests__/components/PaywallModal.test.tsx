import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import React from "react"
import PaywallModal from "../../components/PaywallModal"

const mockOpenBrowser = jest.fn()
const mockSessionReload = jest.fn()

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...args),
}))

jest.mock("@clerk/clerk-expo", () => ({
  useClerk: jest.fn(),
}))

import { useClerk } from "@clerk/clerk-expo"

function setup() {
  ;(useClerk as jest.Mock).mockReturnValue({
    session: { reload: mockSessionReload },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env.EXPO_PUBLIC_CLERK_CHECKOUT_URL = "https://checkout.example.com/pro"
})

describe("PaywallModal — rendering", () => {
  it("renders feature list when visible", () => {
    setup()
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    expect(screen.getByText("Monthly Insights & spending trends")).toBeTruthy()
    expect(screen.getByText("Full spending history")).toBeTruthy()
    expect(screen.getByText("Export to CSV / JSON")).toBeTruthy()
    expect(screen.getByText("Multi-currency display")).toBeTruthy()
  })

  it("renders pricing text", () => {
    setup()
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    expect(screen.getByText("$4.99")).toBeTruthy()
    expect(screen.getByText("$39.99")).toBeTruthy()
  })

  it("does not render when visible=false", () => {
    setup()
    render(<PaywallModal visible={false} onDismiss={jest.fn()} />)
    expect(screen.queryByTestId("paywall-upgrade-btn")).toBeNull()
  })
})

describe("PaywallModal — dismiss", () => {
  it("calls onDismiss when close button is pressed", () => {
    setup()
    const onDismiss = jest.fn()
    render(<PaywallModal visible onDismiss={onDismiss} />)
    fireEvent.press(screen.getByTestId("paywall-dismiss-btn"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("calls onDismiss when Maybe later is pressed", () => {
    setup()
    const onDismiss = jest.fn()
    render(<PaywallModal visible onDismiss={onDismiss} />)
    fireEvent.press(screen.getByTestId("paywall-dismiss-btn"))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe("PaywallModal — upgrade", () => {
  it("opens browser with checkout URL when Upgrade Now is pressed", async () => {
    setup()
    mockOpenBrowser.mockResolvedValue(undefined)
    mockSessionReload.mockResolvedValue(undefined)
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    fireEvent.press(screen.getByTestId("paywall-upgrade-btn"))
    await waitFor(() => {
      expect(mockOpenBrowser).toHaveBeenCalledWith("https://checkout.example.com/pro")
    })
  })

  it("reloads session after browser closes", async () => {
    setup()
    mockOpenBrowser.mockResolvedValue(undefined)
    mockSessionReload.mockResolvedValue(undefined)
    render(<PaywallModal visible onDismiss={jest.fn()} />)
    fireEvent.press(screen.getByTestId("paywall-upgrade-btn"))
    await waitFor(() => {
      expect(mockSessionReload).toHaveBeenCalledTimes(1)
    })
  })
})
