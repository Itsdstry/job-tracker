import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/src/__tests__/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: true,
};

export default config;
