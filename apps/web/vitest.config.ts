import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './vitest.setup.ts',
        exclude: ['e2e/**', 'node_modules/**'],
        alias: [
            { find: /^@\/convex\/(.*)$/, replacement: resolve(__dirname, '../../convex/$1') },
            { find: /^@\/(.*)$/, replacement: resolve(__dirname, './$1') },
        ],
    },
})
