import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/pages/**/*.astro',
        'node_modules',
        'dist',
        'playground'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70, // Relaxed for complex utility functions with many conditional paths
        statements: 80,
        // Lower threshold for client code since it's browser-specific
        'src/client/**/*.ts': {
          lines: 60,
          functions: 60,
          branches: 60,
          statements: 60,
        },
      },
    },
  },
});
