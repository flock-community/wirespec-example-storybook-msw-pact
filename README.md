# Wirespec Example: Storybook + MSW + Pact

This project demonstrates how to integrate [Wirespec](https://wirespec.dev), [Storybook](https://storybook.js.org/), [MSW (Mock Service Worker)](https://mswjs.io/), and [Pact](https://pact.io/) to create a robust API mocking and contract testing solution for frontend applications.

## Overview

This example showcases a simple Todo application that:

1. Uses Wirespec to define API contracts
2. Generates TypeScript types and API clients from Wirespec definitions
3. Uses MSW to mock API responses in Storybook from Wirespec definitions
4. Captures API interactions with Pact for contract testing

The integration provides a seamless workflow for developing, testing, and documenting frontend components that interact with APIs.

## Features

- **API Definition with Wirespec**: Define your API contracts in a simple, readable format
- **Type-Safe API Clients**: Generate TypeScript types and API clients from Wirespec definitions
- **Interactive Component Testing**: Test components with mocked API responses in Storybook
- **Contract Testing**: Capture API interactions for contract testing with Pact
- **Comprehensive Testing**: Test happy paths and error scenarios with MSW

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wirespec-example-storybook-msw-pact.git
cd wirespec-example-storybook-msw-pact

# Install dependencies
npm install
```

## Usage

### Generate API Types and Clients

```bash
npm run generate
```

This command compiles the Wirespec definitions in the `wirespec` directory and generates TypeScript types and API clients in the `src/gen` directory.

### Run Storybook

```bash
npm run storybook
```

This command starts Storybook, where you can interact with the Todo application components and see how they behave with different API responses.

### Run Tests

```bash
npm test
```

This command runs the tests using Vitest.

## How It Works

1. **API Definition**: The API is defined in `wirespec/todo.ws` using Wirespec syntax
2. **Code Generation**: TypeScript types and API clients are generated from the Wirespec definition
3. **Component Implementation**: The Todo application is implemented as a web component using Lit Element
4. **Storybook Integration**: Storybook stories use MSW to mock API responses
5. **Pact Integration**: API interactions are captured and recorded as Pact contracts

## Example: Mocking an API Response

```typescript
// In a Storybook story
msw.use(
  wirespecMsw(GetTodos.api, async () => GetTodos.response200({body: todos, total: 10}))
)
```

This code mocks the `GET /todos` API to return a successful response with a list of todos.

## Example: Capturing a Pact Interaction

The `wirespecPact` function in `wirespec.ts` automatically captures API interactions and records them as Pact contracts:

```typescript
export const wirespecPact = (req: RawRequest, res: RawResponse) => {
  const interaction: Interaction = {
    // ... interaction details
  };

  // Add the interaction to the Pact contract
  pact.interactions.push(interaction);
}
```

## Pact Reporter

This project includes a custom Vitest reporter that automatically generates Pact contract files from API interactions captured during tests:

```typescript
// Configured in vite.config.ts
test: {
    // other configuration...
    reporters: ['default', 'junit', new PactReporter()]
}
```

The Pact reporter:

1. Collects MSW request/response pairs from test files
2. Transforms them into Pact interactions
3. Creates a Pact contract file with consumer and provider information
4. Writes the Pact contract to the "pacts" directory

When you run tests with `npm test`, the reporter automatically generates Pact files that can be used for contract testing with your API providers.

## Technologies Used

- [Wirespec](https://wirespec.io): API specification and code generation
- [Storybook](https://storybook.js.org/): Component development and testing
- [MSW (Mock Service Worker)](https://mswjs.io/): API mocking
- [Pact](https://pact.io/): Contract testing
- [Lit Element](https://lit.dev/): Web component framework
- [TypeScript](https://www.typescriptlang.org/): Type-safe JavaScript
- [Vitest](https://vitest.dev/): Testing framework
