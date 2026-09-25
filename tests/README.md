Unit tests for the pure modules (no browser APIs): `npm test` runs them with
Node's built-in runner (`node --test`), which executes the TypeScript sources
directly (Node 24 strips the types). Files end in `.test.ts` and import the
sources by relative path, e.g. `../src/popup/search.ts`.
