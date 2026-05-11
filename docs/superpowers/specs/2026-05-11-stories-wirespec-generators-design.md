# Replace story mocks with Wirespec generators

## Goal
Eliminate the hand-written `user`, `todos`, `newTodo`, and `todo` fixtures in
`src/todo-app.stories.ts` and replace them with deterministic output from the
already-generated Wirespec generators (`UserGenerator`, `TodoGenerator`,
`TodoErrorGenerator`) backed by `kotestWirespecGenerator(seed)` from
`@flock/wirespec/generator`.

## Scope
- One file edited: `src/todo-app.stories.ts`.
- No changes to app code (`src/todo-app.ts`, `src/todoClient.ts`).
- No changes to `wirespec/todo.ws` or `openapi/user.json`.
- No new dependencies — `@flock/wirespec/generator` is already exposed by the
  installed `@flock/wirespec` package.

## Design

### Fixture construction
A single shared, seeded `Wirespec.Generator` produces every fixture at module
load time so all stories see identical values across reloads:

```ts
const gen = kotestWirespecGenerator(42);
const user: User    = UserGenerator.generate(gen, ["user"]);
const todos: Todo[] = [
  TodoGenerator.generate(gen, ["todos", "0"]),
  TodoGenerator.generate(gen, ["todos", "1"]),
];
```

Per-story payloads (the bodies returned by `PostTodo`, `PutTodo`, `DeleteTodo`,
and the `TodoError` reasons) are drawn from the same generator with distinct
path roots so each gets a stable but distinct value.

### Assertion derivation
Every assertion that currently encodes a literal from a mock now reads from
the generated value:

| Current literal | Replaced with |
|---|---|
| `req.path === {id: "2"}` | `req.path === {id: String(todos[1].id)}` |
| `req.body.description === 'Todo 2'` | `req.body.description === todos[1].description` |
| `req.body.date === '01-02-2022'` | `req.body.date === todos[1].date` |
| `req.body.done === true` | `req.body.done === !todos[1].done` |
| `findByShadowLabelText("Todo 2")` | `findByShadowLabelText(todos[1].description)` |
| `"Cannot fetch todos: server error"` | `` `Cannot fetch todos: ${fetchError.reason}` `` |
| similar for create/toggle/delete errors | derive from `TodoErrorGenerator` outputs |

The `addTodo` story's expectation `req.body === { date: "01-01-2022",
description: "new Todo", done: false }` stays literal — that body is produced
by `todo-app.ts:addTodo` and the user's typed input, not by any story fixture.

The `UserApiError` story's `"Cannot fetch current user"` assertion is a
constant string emitted by `todo-app.ts:loadUser` and stays literal too.

### What stays unchanged
- MSW handler wiring via `wirespecMsw(...)`.
- All `play` interactions (typing input, clicking buttons, finding list items).
- Story names, exports, and the meta object.

## Risk
`wirespec/todo.ws` declares `Todo.id: Integer` without bounds. Per
`wirespec-generator.d.ts`, unbounded Integers can exceed
`Number.MAX_SAFE_INTEGER` and lose precision when `String(id)` is then
`parseInt`-ed (which `todo-app.ts` does in `toggleTodo`/`deleteTodo`). With
seed `42` and 5 ids drawn this is very unlikely; if a story flakes we will
either re-seed or tighten the `.ws` to `Integer(0, 1_000_000)`.

## Verification
1. `npm run compile` — types must remain clean.
2. `npm run test` (vitest + Storybook addon) — every story's `play` assertion
   must still pass with the derived expectations.
