export namespace Wirespec {
  export type Method = "GET" | "PUT" | "POST" | "DELETE" | "OPTIONS" | "HEAD" | "PATCH" | "TRACE"
  export type RawRequest = { method: Method, path: string[], queries: Record<string, string>, headers: Record<string, string>, body?: string }
  export type RawResponse = { status: number, headers: Record<string, string>, body?: string }
  export type Content<T> = { type:string, body:T }
  export type Request<T> = { path: Record<string, unknown>, method: Method, query?: Record<string, unknown>, headers?: Record<string, unknown>, content?:Content<T> }
  export type Response<T> = { status:number, headers?: Record<string, unknown>, content?:Content<T> }
  export type Serialization = { serialize: <T>(type: T) => string; deserialize: <T>(raw: string | undefined) => T }
  export type Client<REQ extends Request<unknown>, RES extends Response<unknown>> = (serialization: Serialization) => { to: (request: REQ) => RawRequest; from: (response: RawResponse) => RES }
  export type Server<REQ extends Request<unknown>, RES extends Response<unknown>> = (serialization: Serialization) => { from: (request: RawRequest) => REQ; to: (response: RES) => RawResponse }
  export type Api<REQ extends Request<unknown>, RES extends Response<unknown>> = { name: string; method: Method, path: string, client: Client<REQ, RES>; server: Server<REQ, RES> }
}
export type Date = string;
const regExpDate = /^([0-9]{2}-[0-9]{2}-[0-9]{4})$/g;
export const validateDate = (value: string): value is Date => 
  regExpDate.test(value);

export type Todo = {
  "id": number,
  "description": string,
  "done": boolean,
  "date": Date
}


export type TodoInput = {
  "description": string,
  "done": boolean,
  "date": Date
}


export type Error = {
  "reason": string
}


export namespace GetTodos {
  type Path = {}
  type Queries = {
    "limit": number,
    "offset": number,
  }
  type Headers = {}
  export type Request = { 
    path: Path
    method: "GET"
    queries: Queries
    headers: Headers
    body: undefined
  }
  export type Response200 = {
    status: 200
    headers: {"total": number}
    body: Todo[]
  }
  export type Response500 = {
    status: 500
    headers: {}
    body: Error
  }
  export type Response = Response200 | Response500
  export const request = (props: {"limit": number, "offset": number}): Request => ({
    path: {},
    method: "GET",
    queries: {"limit": props["limit"], "offset": props["offset"]},
    headers: {},
    body: undefined,
  })
  export const response200 = (props: {"total": number, "body": Todo[]}): Response200 => ({
    status: 200,
    headers: {"total": props["total"]},
    body: props.body,
  })
  export const response500 = (props: {"body": Error}): Response500 => ({
    status: 500,
    headers: {},
    body: props.body,
  })
  export type Handler = {
    getTodos: (request:Request) => Promise<Response>
  }
  export const client: Wirespec.Client<Request, Response> = (serialization: Wirespec.Serialization) => ({
    to: (it) => ({
      method: "GET",
      path: ["todos"],
      queries: {"limit": serialization.serialize(it.queries["limit"]), "offset": serialization.serialize(it.queries["offset"])},
      headers: {},
      body: serialization.serialize(it.body)
    }),
    from: (it) => {
      switch (it.status) {
        case 200:
          return {
            status: 200,
            headers: {"total": serialization.deserialize(it.headers["total"])},
            body: serialization.deserialize<Todo[]>(it.body)
          };
        case 500:
          return {
            status: 500,
            headers: {},
            body: serialization.deserialize<Error>(it.body)
          };
        default:
          throw new Error(`Cannot internalize response with status: ${it.status}`);
      }
    }
  })
  export const server:Wirespec.Server<Request, Response> = (serialization: Wirespec.Serialization) => ({
    from: (it) => {
      return {
        method: "GET",
        path: { 
      
        },
        queries: {
          "limit": serialization.deserialize(it.queries["limit"]),      "offset": serialization.deserialize(it.queries["offset"])
        },
        headers: {
  
        },
        body: serialization.deserialize(it.body)
      }
    },
    to: (it) => ({
      status: it.status,
      headers: {},
      body: serialization.serialize(it.body),
    })
  })
  export const api = {
    name: "getTodos",
    method: "GET",
    path: "todos",
    server,
    client
  } as const
}

export namespace PostTodo {
  type Path = {}
  type Queries = {}
  type Headers = {}
  export type Request = { 
    path: Path
    method: "POST"
    queries: Queries
    headers: Headers
    body: TodoInput
  }
  export type Response200 = {
    status: 200
    headers: {}
    body: Todo
  }
  export type Response500 = {
    status: 500
    headers: {}
    body: Error
  }
  export type Response = Response200 | Response500
  export const request = (props: {"body": TodoInput}): Request => ({
    path: {},
    method: "POST",
    queries: {},
    headers: {},
    body: props.body,
  })
  export const response200 = (props: {"body": Todo}): Response200 => ({
    status: 200,
    headers: {},
    body: props.body,
  })
  export const response500 = (props: {"body": Error}): Response500 => ({
    status: 500,
    headers: {},
    body: props.body,
  })
  export type Handler = {
    postTodo: (request:Request) => Promise<Response>
  }
  export const client: Wirespec.Client<Request, Response> = (serialization: Wirespec.Serialization) => ({
    to: (it) => ({
      method: "POST",
      path: ["todos"],
      queries: {},
      headers: {},
      body: serialization.serialize(it.body)
    }),
    from: (it) => {
      switch (it.status) {
        case 200:
          return {
            status: 200,
            headers: {},
            body: serialization.deserialize<Todo>(it.body)
          };
        case 500:
          return {
            status: 500,
            headers: {},
            body: serialization.deserialize<Error>(it.body)
          };
        default:
          throw new Error(`Cannot internalize response with status: ${it.status}`);
      }
    }
  })
  export const server:Wirespec.Server<Request, Response> = (serialization: Wirespec.Serialization) => ({
    from: (it) => {
      return {
        method: "POST",
        path: { 
      
        },
        queries: {
  
        },
        headers: {
  
        },
        body: serialization.deserialize(it.body)
      }
    },
    to: (it) => ({
      status: it.status,
      headers: {},
      body: serialization.serialize(it.body),
    })
  })
  export const api = {
    name: "postTodo",
    method: "POST",
    path: "todos",
    server,
    client
  } as const
}

export namespace PutTodo {
  type Path = {
    "id": number,
  }
  type Queries = {}
  type Headers = {}
  export type Request = { 
    path: Path
    method: "PUT"
    queries: Queries
    headers: Headers
    body: TodoInput
  }
  export type Response200 = {
    status: 200
    headers: {}
    body: Todo
  }
  export type Response404 = {
    status: 404
    headers: {}
    body: undefined
  }
  export type Response500 = {
    status: 500
    headers: {}
    body: Error
  }
  export type Response = Response200 | Response404 | Response500
  export const request = (props: {"id": number, "body": TodoInput}): Request => ({
    path: {"id": props["id"]},
    method: "PUT",
    queries: {},
    headers: {},
    body: props.body,
  })
  export const response200 = (props: {"body": Todo}): Response200 => ({
    status: 200,
    headers: {},
    body: props.body,
  })
  export const response404 = (): Response404 => ({
    status: 404,
    headers: {},
    body: undefined,
  })
  export const response500 = (props: {"body": Error}): Response500 => ({
    status: 500,
    headers: {},
    body: props.body,
  })
  export type Handler = {
    putTodo: (request:Request) => Promise<Response>
  }
  export const client: Wirespec.Client<Request, Response> = (serialization: Wirespec.Serialization) => ({
    to: (it) => ({
      method: "PUT",
      path: ["todos", serialization.serialize(it.path["id"])],
      queries: {},
      headers: {},
      body: serialization.serialize(it.body)
    }),
    from: (it) => {
      switch (it.status) {
        case 200:
          return {
            status: 200,
            headers: {},
            body: serialization.deserialize<Todo>(it.body)
          };
        case 404:
          return {
            status: 404,
            headers: {},
            body: serialization.deserialize<undefined>(it.body)
          };
        case 500:
          return {
            status: 500,
            headers: {},
            body: serialization.deserialize<Error>(it.body)
          };
        default:
          throw new Error(`Cannot internalize response with status: ${it.status}`);
      }
    }
  })
  export const server:Wirespec.Server<Request, Response> = (serialization: Wirespec.Serialization) => ({
    from: (it) => {
      return {
        method: "PUT",
        path: { 
          "id": serialization.deserialize(it.path[1])
        },
        queries: {
  
        },
        headers: {
  
        },
        body: serialization.deserialize(it.body)
      }
    },
    to: (it) => ({
      status: it.status,
      headers: {},
      body: serialization.serialize(it.body),
    })
  })
  export const api = {
    name: "putTodo",
    method: "PUT",
    path: "todos/:id",
    server,
    client
  } as const
}

export namespace DeleteTodo {
  type Path = {
    "id": number,
  }
  type Queries = {}
  type Headers = {}
  export type Request = { 
    path: Path
    method: "DELETE"
    queries: Queries
    headers: Headers
    body: undefined
  }
  export type Response200 = {
    status: 200
    headers: {}
    body: Todo
  }
  export type Response500 = {
    status: 500
    headers: {}
    body: Error
  }
  export type Response = Response200 | Response500
  export const request = (props: {"id": number}): Request => ({
    path: {"id": props["id"]},
    method: "DELETE",
    queries: {},
    headers: {},
    body: undefined,
  })
  export const response200 = (props: {"body": Todo}): Response200 => ({
    status: 200,
    headers: {},
    body: props.body,
  })
  export const response500 = (props: {"body": Error}): Response500 => ({
    status: 500,
    headers: {},
    body: props.body,
  })
  export type Handler = {
    deleteTodo: (request:Request) => Promise<Response>
  }
  export const client: Wirespec.Client<Request, Response> = (serialization: Wirespec.Serialization) => ({
    to: (it) => ({
      method: "DELETE",
      path: ["todos", serialization.serialize(it.path["id"])],
      queries: {},
      headers: {},
      body: serialization.serialize(it.body)
    }),
    from: (it) => {
      switch (it.status) {
        case 200:
          return {
            status: 200,
            headers: {},
            body: serialization.deserialize<Todo>(it.body)
          };
        case 500:
          return {
            status: 500,
            headers: {},
            body: serialization.deserialize<Error>(it.body)
          };
        default:
          throw new Error(`Cannot internalize response with status: ${it.status}`);
      }
    }
  })
  export const server:Wirespec.Server<Request, Response> = (serialization: Wirespec.Serialization) => ({
    from: (it) => {
      return {
        method: "DELETE",
        path: { 
          "id": serialization.deserialize(it.path[1])
        },
        queries: {
  
        },
        headers: {
  
        },
        body: serialization.deserialize(it.body)
      }
    },
    to: (it) => ({
      status: it.status,
      headers: {},
      body: serialization.serialize(it.body),
    })
  })
  export const api = {
    name: "deleteTodo",
    method: "DELETE",
    path: "todos/:id",
    server,
    client
  } as const
}
