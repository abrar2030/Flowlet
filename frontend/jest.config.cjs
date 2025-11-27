const { defaults } = require("jest-config");

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  moduleNameMapper: {
    // Handle module aliases (if configured in tsconfig.json)
    "^@/(.*)$": "<rootDir>/$1",
    // Mock lucide-react icons
    "lucide-react": "<rootDir>/__mocks__/lucide-react.js",
  },
  testPathIgnorePatterns: ["/node_modules/"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
