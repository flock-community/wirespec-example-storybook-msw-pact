import type {Preview} from '@storybook/web-components'
import {initialize, mswLoader} from 'msw-storybook-addon'
import { within as withinShadow } from 'shadow-dom-testing-library';

// Initialize MSW
initialize({
    onUnhandledRequest: 'bypass',
    quiet: true,
});

const preview: Preview = {
    beforeEach({ canvasElement, canvas }) {
        Object.assign(canvas, { ...withinShadow(canvasElement)});
    },
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
    },
    loaders: [mswLoader],
};

export default preview;