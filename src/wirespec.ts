import {http, type HttpHandler, HttpResponse, HttpResponseResolver} from 'msw';

export type Method = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH' | 'TRACE';
export type RawRequest = {
    method: Method;
    path: string[];
    queries: Record<string, string>;
    headers: Record<string, string>;
    body?: string;
};
export type RawResponse = { status: number; headers: Record<string, string>; body?: string };
export type Request<T> = {
    path: Record<string, unknown>;
    method: Method;
    queries?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    body?: T;
};
export type Response<T> = { status: number; headers?: Record<string, unknown>; body?: T };
export type Serialization = { serialize: <T>(type: T) => string; deserialize: <T>(raw: string | undefined) => T };
export type Client<REQ extends Request<unknown>, RES extends Response<unknown>> = (serialization: Serialization) => {
    to: (request: REQ) => RawRequest;
    from: (response: RawResponse) => RES;
};
export type Server<REQ extends Request<unknown>, RES extends Response<unknown>> = (serialization: Serialization) => {
    from: (request: RawRequest) => REQ;
    to: (response: RES) => RawResponse;
};
export type Api<REQ extends Request<unknown>, RES extends Response<unknown>> = {
    name: string;
    method: string;
    path: string;
    client: Client<REQ, RES>;
    server: Server<REQ, RES>;
};
type Handler<Req extends Request<unknown>, Res extends Response<unknown>> = (request: Req) => Promise<Res>;

export const serialization: Serialization = {
    deserialize<T>(raw: string | undefined): T {
        if (raw === undefined) {
            return undefined as T;
        }
        if (raw.startsWith('{') && raw.endsWith('}')) return JSON.parse(raw) as T;
        if (raw.startsWith('[') && raw.endsWith(']')) return JSON.parse(raw) as T;
        return raw as T;
    },
    serialize<T>(type: T): string {
        if (typeof type === 'string') {
            return type;
        }
        return JSON.stringify(type);
    },
};

type GenericApi<REQ, RES> = Api<Request<REQ>, Response<RES>>;
type ApiClient<REQ, RES> = (req: REQ) => Promise<RES>;
type ApiClientMap<Apis extends GenericApi<unknown, unknown>[]> = {
    [K in Apis[number]['name']]: Extract<Apis[number], { name: K }> extends Api<infer ReqType, infer ResType>
        ? ApiClient<ReqType, ResType>
        : never;
};

type WirespecClient = <Apis extends GenericApi<unknown, unknown>[]>(...apis: Apis) => ApiClientMap<Apis>;
type WirespecCall = (req: RawRequest) => Promise<RawResponse>
type WirespecMsw = <Req extends Request<unknown>, Res extends Response<unknown>>(api: Api<Req, Res>, handler: Handler<Req, Res>) => HttpHandler


const wirespecCall: WirespecCall = async (req) => {
    const headers = req.body ? {'Content-Type': 'application/json'} : undefined;
    const body = req.body !== undefined ? req.body : undefined;
    const query = Object.entries(req.queries)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    const path = `/${req.path.join('/')}${query ? `?${query}` : ''}`;
    const res = await fetch(path, {method: req.method, body, headers});
    const contentType = res.headers.get('Content-Type');
    const contentLength = res.headers.get('Content-Length');
    return {
        status: res.status,
        headers: {
            ...headers,
            ...contentType ? {'Content-Type': contentType} : {},
        },
        body: contentLength !== '0' && contentType ? await res.text() : undefined,
    };
};

export const wirespecClient: WirespecClient =
    (...apis) => {
        const proxy = new Proxy(
            {},
            {
                get: (_, prop) => {
                    const api = apis.find((it) => it.name === prop);
                    if (api === undefined) throw new Error(`Cannot find api with name: ${prop.toString()}`);
                    const client = api.client(serialization);
                    return async (req: Request<unknown>) => {
                        const rawRequest = client.to(req);
                        const rawResponse = await wirespecCall(rawRequest);
                        const response = client.from(rawResponse);
                        return Promise.resolve(response);
                    };
                },
            },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return proxy as any;
    };

export const wirespecMsw: WirespecMsw =
    (api, handler) => {
        const server = api.server(serialization);
        const resolver: HttpResponseResolver = async (ctx) => {
            const contentType = ctx.request.headers.get('Content-Type');
            const body = contentType ? await ctx.request.text() : undefined;
            const url = new URL(ctx.request.url);
            const path = url.pathname.replace(`/`, '').split('/');
            const rawRequest: RawRequest = {
                method: ctx.request.method.toUpperCase() as Method,
                path,
                queries: [...url.searchParams.entries()].reduce((acc, [key, value]) => ({...acc, [key]: value}), {}),
                headers: {},
                body,
            };
            const request = server.from(rawRequest);
            const response = await handler(request);
            const rawResponse: RawResponse = server.to(response);
            if (rawResponse.body) {
                const json = JSON.parse(rawResponse.body);
                return HttpResponse.json(json, {status: rawResponse.status});
            }
            return new HttpResponse(null, {status: rawResponse.status});
        };
        switch (api.method) {
            case 'GET':
                return http.get(`/${api.path}`, resolver);
            case 'POST':
                return http.post(`/${api.path}`, resolver);
            case 'PUT':
                return http.put(`/${api.path}`, resolver);
            case 'DELETE':
                return http.delete(`/${api.path}`, resolver);
            default:
                throw new Error(`Cannot match requst ${api.method}`);
        }
    };
