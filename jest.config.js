module.exports = {
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx|js)$": ["babel-jest"],
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo|@expo|react-native-|@react-navigation))"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
}
