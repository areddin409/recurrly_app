import {
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react-native"
import React from "react"
import Settings from "../app/(tabs)/settings"

// ── Clerk mocks ──────────────────────────────────────────────────────────────
const mockSignOut = jest.fn()
const mockOpenBrowser = jest.fn()

jest.mock("@clerk/clerk-expo", () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
  useClerk: jest.fn()
}))

jest.mock("expo-web-browser", () => ({
  openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...args)
}))

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() })
}))

jest.mock("@/lib/interop", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  Image: (props: any) => {
    const { View } = require("react-native")
    return <View testID="image" {...props} />
  }
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo"

function setupClerk({ isPro = false } = {}) {
  ;(useUser as jest.Mock).mockReturnValue({
    user: {
      fullName: "test user",
      firstName: "test",
      primaryEmailAddress: { emailAddress: "areddin409+test@gmail.com" },
      imageUrl: "https://example.com/avatar.jpg"
    }
  })
  ;(useAuth as jest.Mock).mockReturnValue({
    signOut: mockSignOut,
    has: ({ feature }: { feature: string }) =>
      feature === "pro" ? isPro : false
  })
  ;(useClerk as jest.Mock).mockReturnValue({})
}

// ── Tests ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks()
})

describe("Settings — account card", () => {
  it("renders user name and email", () => {
    setupClerk()
    render(<Settings />)
    expect(screen.getByText("test user")).toBeTruthy()
    expect(screen.getByText("areddin409+test@gmail.com")).toBeTruthy()
  })

  it("shows FREE badge for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByText("FREE")).toBeTruthy()
    expect(screen.queryByText("PRO")).toBeNull()
  })

  it("shows PRO badge for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.getByText("PRO")).toBeTruthy()
    expect(screen.queryByText("FREE")).toBeNull()
  })
})

describe("Settings — PLAN section", () => {
  it("shows Upgrade to Pro row for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByText("Upgrade to Pro")).toBeTruthy()
  })

  it("hides Upgrade to Pro row for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.queryByText("Upgrade to Pro")).toBeNull()
  })
})

describe("Settings — DATA section", () => {
  it("shows PRO pill on Export Data for free users", () => {
    setupClerk({ isPro: false })
    render(<Settings />)
    expect(screen.getByTestId("export-pro-pill")).toBeTruthy()
  })

  it("hides PRO pill on Export Data for pro users", () => {
    setupClerk({ isPro: true })
    render(<Settings />)
    expect(screen.queryByTestId("export-pro-pill")).toBeNull()
  })

  it("always renders Import CSV row", () => {
    setupClerk()
    render(<Settings />)
    expect(screen.getByText("Import CSV")).toBeTruthy()
  })
})

describe("Settings — sign out", () => {
  it("calls signOut when Sign Out row is pressed", async () => {
    setupClerk()
    mockSignOut.mockResolvedValue(undefined)
    render(<Settings />)
    fireEvent.press(screen.getByTestId("sign-out-btn"))
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })

  it("disables Sign Out while signing out", async () => {
    setupClerk()
    let resolve: () => void
    mockSignOut.mockReturnValue(
      new Promise<void>((r) => {
        resolve = r
      })
    )
    render(<Settings />)
    fireEvent.press(screen.getByTestId("sign-out-btn"))
    expect(screen.getByText("Signing Out…")).toBeTruthy()
    resolve!()
  })
})

describe("Settings — Manage Account", () => {
  it("opens browser when Manage Account is pressed", async () => {
    setupClerk()
    mockOpenBrowser.mockResolvedValue(undefined)
    render(<Settings />)
    fireEvent.press(screen.getByTestId("manage-account-btn"))
    await waitFor(() => {
      expect(mockOpenBrowser).toHaveBeenCalledTimes(1)
    })
  })
})
