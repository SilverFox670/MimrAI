/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/tests'
  ],
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/core/$1',
    '@adapters/(.*)': '<rootDir>/src/adapters/$1',
    '@interfaces/(.*)': '<rootDir>/src/interfaces/$1',
    '@content/(.*)': '<rootDir>/src/content/$1'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**/*.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary'
  ],
  verbose: true,
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
}
