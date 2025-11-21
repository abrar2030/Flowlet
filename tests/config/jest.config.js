module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "**/unit/**/*.test.[jt]s?(x)",
    "**/integration/**/*.test.[jt]s?(x)",
    "**/security/**/*.test.[jt]s?(x)",
    "**/compliance/**/*.test.[jt]s?(x)",
    "**/performance/**/*.test.[jt]s?(x)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
};
