# Project Build and Test Guidelines

This document provides instructions on how to build and test the project.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm (comes with Node.js)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Building the Project

### Generate API Code

Generate TypeScript code from Wirespec definitions:

```bash
npm run generate
```

This command compiles Wirespec definitions from the `./wirespec` directory and outputs TypeScript code to `./src/gen`.

### Compile TypeScript

Compile the TypeScript code to JavaScript:

```bash
npm run compile
```

This command compiles the TypeScript code from the `./src` directory and outputs JavaScript to the `./lib` directory according to the configuration in `tsconfig.json`.

## Testing

### Running Tests

Run all tests using Vitest:

```bash
npm test
```

This command:
- Runs tests for all Storybook stories (`src/**/*.stories.ts`)
- Uses Chromium browser via Playwright for browser-based testing
- Generates test reports in JUnit format (`./junit.xml`)
- Uses MSW (Mock Service Worker) for API mocking
- Generates Pact contract files in the `./pacts` directory

### Test Configuration

Tests are configured in:
- `vite.config.ts` - Main test configuration
- `.storybook/vitest.setup.ts` - Test setup including MSW integration

## Storybook

### Running Storybook

Start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook on port 6006. Open your browser to http://localhost:6006 to view the component stories.

## Project Structure

- `src/` - Source code
- `lib/` - Compiled output
- `.storybook/` - Storybook configuration
- `wirespec/` - Wirespec API definitions
- `pacts/` - Generated Pact contract files

## Technologies Used

- TypeScript - Programming language
- Storybook - Component development and testing
- MSW - API mocking
- Pact - Contract testing
- Vitest - Testing framework
- Wirespec - API specification