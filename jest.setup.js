// Define react-native globals
global.__DEV__ = true
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: {},
}

// Mock TurboModule registry to prevent native module lookups
jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  getEnforcing: () => ({}),
  get: () => ({}),
}))

// Silence console errors during tests
if (global.console) {
  global.console.error = jest.fn()
  global.console.warn = jest.fn()
}
