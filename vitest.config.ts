import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: './vitest.setup.ts',
        include: ['convex/**/*.test.ts'],
        exclude: ['node_modules/**', 'apps/**', 'packages/**', 'e2e/**'],
    },
})
