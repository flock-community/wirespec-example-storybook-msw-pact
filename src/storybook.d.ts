import '@storybook/csf'

import { within } from 'shadow-dom-testing-library';

declare module '@storybook/csf' {
    type ShadowCanvas = ReturnType<typeof within>;
    interface Canvas extends ShadowCanvas {}
}
