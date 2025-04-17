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
    pactRust: { ffi: string; models: string };
  };
}