# AGENTS.md

Guidance for AI coding agents working in this repository. The architecture overview lives in `docs/agent-architecture-overview.md`.

## What Matters Most

- Treat `tsdav` as a public TypeScript library. Preserve existing public API
  behavior unless the task explicitly asks for a breaking change.
- Keep changes narrow and source-first. Update `src/`, tests, and docs as
  needed; do not hand-edit `dist/` unless the task is specifically about
  release artifacts.
- Preserve runtime portability across Node.js, browsers, Bun, Deno, and
  Workers. Avoid adding Node-only APIs to shared runtime paths.
- Do not run live provider integration tests unless credentials are configured
  and the user asked for that level of verification.

## Runtime Targets

- Target support is Node.js, vanilla client-side JavaScript in browsers, Deno,
  Bun, Cloudflare Workers, and Electron.
- Do not write environment-specific code that breaks any supported runtime.
  Avoid hard dependencies on Node globals, browser globals, filesystem access,
  process APIs, or bundler-only behavior in shared source paths.
- When runtime-specific behavior is unavoidable, isolate it behind existing
  extension points such as custom `fetch`, credentials, headers, or
  `fetchOptions`, and keep the default path portable.

## Repo Map

- `src/index.ts` defines the package exports.
- `src/client.ts` contains `DAVClient` and `createDAVClient` orchestration.
- `src/request.ts` owns low-level DAV requests and object helpers.
- `src/account.ts`, `src/collection.ts`, `src/calendar.ts`, and
  `src/addressBook.ts` implement WebDAV, CalDAV, and CardDAV workflows.
- `src/types/` contains public model and request types.
- `src/util/` contains shared auth, fetch, XML/request, and type helpers.
- `src/__tests__/unit/` and `src/util/__tests__/` are the default test targets.
- `src/__tests__/integration/<provider>/` contains provider tests that may use
  environment credentials or recorded/mocked network behavior.
- `docs/docs/` is the maintained documentation source. `docs/build/`,
  `docs/.docusaurus/`, and `dist/` are generated outputs.

## Setup And Commands

- Install dependencies with `pnpm install`.
- Run unit tests with `pnpm test:unit` or `pnpm test`.
- Run a targeted unit test with `pnpm exec vitest run <path-to-test>`.
- Run type checking with `pnpm typecheck`.
- Run linting with `pnpm lint`.
- Build package artifacts with `pnpm build`.
- Provider scripts are `pnpm test:apple`, `pnpm test:baikal`,
  `pnpm test:fastmail`, `pnpm test:google`, `pnpm test:nextcloud`, and
  `pnpm test:zoho`.

## Change Workflow

- Read the relevant source module, nearby tests, and matching docs page before
  editing behavior.
- For public API changes, update exports, public types, docs, and examples
  together.
- Add or update unit tests for every bug fix and behavior change. Prefer mocked
  fetch/request tests unless the behavior only appears against a provider.
- If a change affects `DAVClient`, verify both functional helpers and the
  class-based API path when practical.
- Keep generated files out of normal patches. Let `pnpm build` regenerate
  package output when release artifacts are required.

## DAV Guardrails

- Build XML request bodies with existing helpers and `ElementCompact` shapes
  where possible. Avoid ad hoc XML strings unless the surrounding code already
  uses them for that exact case.
- Preserve DAV-specific headers and semantics: `Depth`, `If-Match`,
  `If-None-Match`, `Content-Type`, `REPORT`, `PROPFIND`, `PROPPATCH`, and
  multi-status response parsing.
- Keep custom `headers`, `headersToExclude`, `fetchOptions`, and custom `fetch`
  behavior flowing through high-level APIs to `davRequest`.
- Normalize and compare DAV URLs carefully. Servers differ on trailing slashes,
  relative hrefs, redirects, and object filenames.
- When overriding CalDAV/CardDAV props, keep required fields such as
  `resourcetype` and `supported-calendar-component-set`.
- Preserve known provider quirks documented in
  `docs/agent-architecture-overview.md` and `docs/docs/cloud providers.md`.

## Tests And Credentials

- Unit tests must not require real provider credentials.
- Integration tests load `.env` via `dotenv/config`; start from `.env.example`
  when credentials are needed.
- Use existing `MOCK_FETCH` and `RECORD_NETWORK_REQUESTS` conventions when
  working with provider tests. Do not record or commit secrets.
- If credentials are missing, state that integration verification was skipped
  instead of silently treating it as complete.

## Style

- Follow the existing TypeScript style and strictness.
- Prettier settings are single quotes, semicolons, 2-space indentation, and
  100-character print width.
- Prefer existing helper functions and local patterns over new abstractions.
- Keep comments sparse and focused on DAV behavior that is not obvious from the
  code.
- Use `DEBUG=tsdav:*` when debugging request flows.
