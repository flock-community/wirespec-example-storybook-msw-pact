import type { StorybookConfig } from '@storybook/web-components-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test",
  ],
  "framework": {
    "name": "@storybook/web-components-vite",
    "options": {}
  },
  "staticDirs": ["../public"],
  "viteFinal": async (config) => {
    // Add any custom Vite configuration here
    return config;
  }
};
export default config;
