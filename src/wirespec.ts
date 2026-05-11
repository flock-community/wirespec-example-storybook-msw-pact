import {http, type HttpHandler, HttpResponse, type HttpResponseResolver} from 'msw';
import {wirespecSerialization} from '@flock/wirespec/serialization';
import {wirespecFetchIr} from '@flock/wirespec/fetch';
import type {Wirespec} from './gen/Wirespec';

// The IR-pipeline serialization shipped by @flock/wirespec already implements
// the full Wirespec.Serialization contract (body/path/param + legacy
// serialize/deserialize). We re-export it under the generated namespace so
// callers see a single Serialization type.
export const serialization = wirespecSerialization as unknown as Wirespec.Serialization;

// Bridge the IR fetch helper into Wirespec.Transportation. The runtime
// shapes match exactly; the cast just satisfies the structural Method union.
export const transportation: Wirespec.Transportation = {
    transport: (request) => wirespecFetchIr(request as never) as never,
};

type AsyncHandler<Req, Res> = (request: Req) => Promise<Res>;

// MSW glue: register a typed Wirespec handler at the api's url. Path
// templates emitted by the generator use `{id}` syntax; MSW expects `:id`,
// so we rewrite them on the way in.
const toMswPath = (path: string): string =>
    `/${path.replace(/\{([^}]+)\}/g, ':$1')}`;

type ForEachable = {forEach(cb: (value: string, key: string) => void): void};
const collectMulti = (source: ForEachable): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    source.forEach((value, key) => {
        (out[key] ??= []).push(value);
    });
    return out;
};

export const wirespecMsw = <
    Req extends Wirespec.Request<unknown>,
    Res extends Wirespec.Response<unknown>,
>(
    api: Wirespec.Api<Req, Res>,
    handler: AsyncHandler<Req, Res>,
): HttpHandler => {
    const server = api.server(serialization);

    const resolver: HttpResponseResolver = async ({request}) => {
        const url = new URL(request.url);
        const buf = await request.arrayBuffer();
        const rawRequest: Wirespec.RawRequest = {
            method: request.method.toUpperCase(),
            path: url.pathname.replace(/^\//, '').split('/'),
            queries: collectMulti(url.searchParams),
            headers: collectMulti(request.headers),
            body: buf.byteLength > 0 ? new Uint8Array(buf) : undefined,
        };

        const typed = server.from(rawRequest);
        const response = await handler(typed);
        const rawResponse = server.to(response);

        const responseHeaders: Record<string, string> = {};
        for (const [k, values] of Object.entries(rawResponse.headers)) {
            if (values.length > 0) responseHeaders[k] = values.join(',');
        }
        if (rawResponse.body && !responseHeaders['content-type']) {
            responseHeaders['content-type'] = 'application/json';
        }

        return new HttpResponse(rawResponse.body ?? null, {
            status: rawResponse.statusCode,
            headers: responseHeaders,
        });
    };

    const path = toMswPath(api.path);
    switch (api.method) {
        case 'GET':
            return http.get(path, resolver);
        case 'POST':
            return http.post(path, resolver);
        case 'PUT':
            return http.put(path, resolver);
        case 'DELETE':
            return http.delete(path, resolver);
        default:
            throw new Error(`Cannot match request method ${api.method}`);
    }
};
