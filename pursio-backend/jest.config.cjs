module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  transform: { "^.+\\.tsx?$": ["ts-jest", { useESM: true, tsconfig: "<rootDir>/tsconfig.test.json" }] },
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  maxWorkers: 1,
};
