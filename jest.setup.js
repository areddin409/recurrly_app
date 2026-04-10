// Define react-native globals
global.__DEV__ = true

// Set window dimensions so ScrollView doesn't throw
const { Dimensions } = require("react-native")
Dimensions.set({ window: { width: 390, height: 844, scale: 3, fontScale: 1 }, screen: { width: 390, height: 844, scale: 3, fontScale: 1 } })

// Mock native modules that require device APIs
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
}))

// Silence console errors/warns during tests
global.console.error = jest.fn()
global.console.warn = jest.fn()
