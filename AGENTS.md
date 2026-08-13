# AGENTS.md — obsidian-flashcard

Obsidian plugin for flashcard review with Logseq `#flashcard` format support. **Fork of obsidian-spaced-repetition.**

## Layout

- `src/main.ts` — plugin entry
- `src/` — source modules
- `tests/` — Jest test suite
- `docs/` — MkDocs documentation
- `manifest.json` / `versions.json` / `styles.css` / `esbuild.config.mjs` / `eslint.config.mjs` / `tsconfig.json`
- `deploy.mjs` / `release.mjs` — maintainer scripts
- `pnpm-lock.yaml` — **use pnpm, not npm**

## Commands

```bash
pnpm run dev      # esbuild watch -> dist/main.js
pnpm run build    # lint + esbuild production + cp manifest.json styles.css dist/
pnpm run lint     # eslint "**/*.{ts,tsx}"
pnpm run test     # jest
pnpm run validate # concurrently format + lint + test
pnpm run deploy   # copy dist/ to author's local vaults, then delete dist/
pnpm run release  # gh release create from manifest.json version
```

**Always use `pnpm`**, not `npm`. `pnpm-lock.yaml` is the lockfile.

## Build

- esbuild, entry `src/main.ts`, format `cjs`, target `es2018`
- externals: `obsidian`, `electron`, `@codemirror/*`, `@lezer/*`, Node builtins
- Copies `manifest.json` and `styles.css` to `dist/` via shell cp

## Dependencies

Runtime dependencies: `chart.js`, `clozecraft`, `gridjs`, `minimatch`, `pagerank.js`, `short-uuid`.

## Tests

- Jest with `ts-jest` and `jest-environment-jsdom`
- `npm run test` (or `pnpm run test`) runs the full suite
- Pre-commit hooks run `validate` (format + lint + test)

## Versioning

- `release.mjs` reads version from `manifest.json`
- Keep `package.json`, `manifest.json`, and `versions.json` versions in sync
- `manifest.json` author is `"Modified from obsidian-spaced-repetition"` — this is intentional for the fork

## Marketplace / Scorecard

Marketplace, manifest, and release conventions live in the parent `obsidian-plugins-parent/AGENTS.md`. Read it before touching `manifest.json`, release flow, or marketplace-facing code.