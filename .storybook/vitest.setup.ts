import {beforeAll} from 'vitest';

import {setProjectAnnotations} from '@storybook/web-components';
import * as previewAnnotations from './preview';
import {getWorker} from "msw-storybook-addon";

declare module 'vitest' {
    type MswRequest = {
        method: string,
        path: string,
        headers: Record<string, string>,
        query: Record<string, string>,
        body: string,
    }
    type MswResponse = {
        status: number,
        headers: Record<string, string>,
        body: string,
    }

    interface TaskMeta {
        msw: Record<string, {
            request: MswRequest,
            response: MswResponse
        }>
    }
}

const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(annotations.beforeAll);

beforeAll((suite) => {
    const msw = getWorker();
    suite.meta.msw = {}
    msw.events.on('response:mocked', async ({request, requestId, response}) => {
        const url = new URL(request.url)
        suite.meta.msw[requestId] = {
            request: {
                method: request.method,
                path: url.pathname,
                headers: Object.fromEntries(request.headers),
                query: Object.fromEntries(url.searchParams),
                body: await request.text()
            },
            response: {
                status: response.status,
                headers: Object.fromEntries(request.headers),
                body: await response.text()
            }
        }
    })
})
