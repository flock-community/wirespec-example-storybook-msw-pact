import { defineConfig } from 'vite';
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';

export default defineConfig({
    plugins: [storybookTest()],
    test: {
        include: ['src/**/*.stories.?(m)[jt]s?(x)'],
        browser: {
            enabled: true,
            name: 'chromium',
            provider: 'playwright',
            headless: true,
        },
        reporters: ['default', 'junit'],
        outputFile: {
            junit: './junit.xml',
        },
        coverage: {
            provider: 'v8',
            include: ['src/**'],
            exclude: ['src/**/*.stories.ts'],
        },
        isolate: true,
        setupFiles: ['./.storybook/vitest.setup.ts'],
    },
});