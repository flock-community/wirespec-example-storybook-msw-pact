import * as fs from "node:fs";
import * as path from "node:path";
import {RunnerTestFile} from "vitest";

type MswRequest = {
    method: string,
    path: string,
    headers: Record<string, string>,
    query?: Record<string, string>;
    body: string,
}
type MswResponse = {
    status: number,
    headers: Record<string, string>,
    body: string,
}

export type Interaction = {
    description: string;
    pending: boolean;
    request: {
        method: string;
        path: string;
        headers: Record<string, string>;
        query?: Record<string, string>;
        body?: unknown;
    };
    response: {
        status: number;
        headers: Record<string, string>;
        body?: {
            content: unknown;
            contentType: string;
            encoded: boolean;
        };
    };
    type: string;
}

export type Pact = {
    consumer: { name: string };
    provider: { name: string };
    interactions: Interaction[];
    metadata: {
        pactSpecification: { version: string };
    };
}

/**
 * Custom Vitest reporter that writes Pact files to the filesystem
 */
class PactReporter {

    onFinished(files: RunnerTestFile[]) {
        const collect: Record<string, { request: MswRequest, response: MswResponse }> = files.reduce((acc, cur) => {
            // @ts-ignore
            const {msw} = cur.meta
            return {...acc, ...msw}
        }, {})

        const interactions: Interaction[] = Object.entries(collect)
            .map(([requestId, {request, response}]) => ({
                description: `[${simpleHash(JSON.stringify(request) + JSON.stringify(response))}] ${request.method} ${request.path}`,
                pending: false,
                request: {
                    method: request.method,
                    path: request.path,
                    headers: request.headers,
                    query: request.query,
                    body: request.body,
                },
                response: {
                    status: response.status,
                    headers: response.headers,
                    body: response.body ? {
                        content: response.body,
                        contentType: 'application/json', // Or determine content type dynamically
                        encoded: false, // Set as needed
                    } : undefined,
                },
                type: 'interaction', // Provide the interaction type
            }))
            .filter((interaction, index, self) =>
                index === self.findIndex((it) => it.description === interaction.description)
            );

        const pact: Pact = {
            consumer: {name: "pact"},
            provider: {name: "todo"},
            interactions,
            metadata: {
                pactSpecification: {version: "4.0.0"}
            }
        }
        const pactDir = path.join(process.cwd(), "pacts")
        if (!fs.existsSync(pactDir)) {
            fs.mkdirSync(pactDir, {recursive: true})
        }
        const pactFile = path.join(pactDir, `${pact.provider.name}-${pact.consumer.name}.json`)
        fs.writeFileSync(pactFile, JSON.stringify(pact, null, 2))
    }
}

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
    }
    // Convert to 32bit unsigned integer in base 36 and pad with "0" to ensure length is 7.
    return (hash >>> 0).toString(36).padStart(7, '0').toUpperCase();
};

export default PactReporter;
