import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/lib/test/setup.ts'],
  maxWorkers: 1,
  maxConcurrency: 1,
  workerIdleMemoryLimit: '2GB',
  testRunner: 'jest-circus/runner',
  verbose: true,
  detectLeaks: false,
  detectOpenHandles: true,
  forceExit: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false
    }
  }
}

export default config; 