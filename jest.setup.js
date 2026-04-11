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

// Mock animation/gesture libraries that require native modules
jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native")
  const identity = (x) => x
  const noop = () => {}
  const useSharedValue = (init) => ({ value: init })
  const useAnimatedStyle = (fn) => fn()
  return {
    __esModule: true,
    default: { View },
    Animated: { View },
    useSharedValue,
    useAnimatedStyle,
    withTiming: (value, _options, callback) => { if (callback) callback(true); return value },
    withSpring: (value, _options, callback) => { if (callback) callback(true); return value },
    Easing: { out: identity, cubic: identity, in: identity },
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    cancelAnimation: noop,
    useAnimatedGestureHandler: () => ({}),
  }
})

jest.mock("react-native-gesture-handler", () => {
  // Return a fluent builder that accepts any chained method call
  const builder = () => {
    const proxy = new Proxy({}, {
      get: () => (_arg) => proxy,
    })
    return proxy
  }
  return {
    Gesture: {
      Pan: builder,
      Tap: builder,
      Fling: builder,
      LongPress: builder,
      Pinch: builder,
      Rotation: builder,
      Simultaneous: builder,
      Exclusive: builder,
      Race: builder,
    },
    GestureDetector: ({ children }) => children,
    GestureHandlerRootView: ({ children }) => children,
  }
})

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: (fn) => fn(),
}))

// Silence console errors/warns during tests
global.console.error = jest.fn()
global.console.warn = jest.fn()
