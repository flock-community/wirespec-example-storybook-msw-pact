import { beforeAll } from 'vitest';

import { setProjectAnnotations } from '@storybook/web-components';
import * as previewAnnotations from './preview';

const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(annotations.beforeAll);
