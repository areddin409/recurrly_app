// Define react-native globals
global.__DEV__ = true
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
}

// Mock TurboModule registry to prevent native module lookups
jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  getEnforcing: () => ({
    getConstants: () => ({
      Dimensions: { screen: { width: 390, height: 844, scale: 3, fontScale: 1 } },
      isIPhoneX_deprecated: false,
    }),
    initialDimensions: { screen: { width: 390, height: 844, scale: 3, fontScale: 1 } },
  }),
  get: () => null,
}))

// Mock native modules that require device APIs
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
}))

// Silence console errors during tests
if (global.console) {
  global.console.error = jest.fn()
  global.console.warn = jest.fn()
}
