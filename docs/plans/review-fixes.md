# Codebase review fixes

Keep `xml-js`, the existing entry points, and runtime portability across Node.js,
browsers, Bun, Deno, and Workers. Do not run live provider tests.

## Stage 1: Response and transport correctness

- Normalize XML after parsing without coercing opaque strings or losing mixed text.
- Preserve namespaces and property statuses while retaining existing property access.
- Reject incomplete or failed collection discovery before calculating deletions.
- Preserve successful raw payloads and apply header exclusions after merging.

## Stage 2: Synchronization and client behavior

- Sync every supported calendar component and extensionless resources safely.
- Keep the REPORT sync token, respect query subsets, and validate expansion inputs.
- Replace quadratic URL comparisons with indexes.
- Share client authentication/request defaults; refresh expired OAuth tokens safely.
- Correct class return types, export `makeCollection`, and restrict build cleanup.

## Stage 3: Documentation and dependencies

- Repair browser, sync, feed-import, and free/busy examples and document actual contracts.
- Reuse the XML normalizer in the docs converter and replace `eval` with JSON parsing.
- Synchronize version labels and describe provider capabilities accurately.
- Remove unused direct dependencies, patch docs advisories, and keep `xml-js`.
- Add repeatable dependency and executable documentation/consumer checks.

## Stage 4: Verification

- Add regressions for the original failing scenarios, including both client APIs.
- Run unit tests, consumer type checks, lint, package build, and packaged entry checks.
- Run docs tests, type checking, production build, and both dependency audits.
- Review the final diff and report remaining verification limits.

## Stage 5: PR #281 review and follow-up

- Reproduce the relative discovery redirect bug and validate the PR and required CI.
- Merge the PR and preserve the existing local review fixes while updating `main`.
- Correct redirect authority handling and remove GET fallback bodies; add regressions.
- Verify the combined changes, including both client APIs, consumer examples, and docs.

## Stage 6: Release readiness

- Build before testing in the release workflow and include consumer/example checks.
- Inspect a freshly packed candidate from a clean snapshot of the local changes.
- Verify packaged imports and mocked requests across installed supported runtimes.
- Report the next version and outstanding Git/release steps without publishing.

## Stage 7: Publish 2.3.5

- Credit `@bensynapse` and PR #281 in the changelog and GitHub release notes.
- Bump the version, regenerate package artifacts, and verify the final candidate.
- Commit the changes, pass the release PR checks, and merge without bypassing checks.
- Pass CI on the merged commit, publish the GitHub release, and verify npm publication.

## Agent progress

- Initial review completed; reproduced sync, parsing, authentication, typing, header,
  build-cleanup, and documentation failures.
- Response normalization, final header exclusion, client authentication sharing, and sync safeguards implemented.
- Documentation examples and converter corrected; unused direct dependencies removed and docs advisories patched.
- Stages 1–4 completed; `xml-js` retained in the library and docs.
- Verification passed: 320 unit tests, 44 docs tests, 3 executable documentation tests,
  public consumer type checks, lint, root/docs type checks, and package/docs builds.
- Frozen lockfile installs, a standalone docs install/build, packed CJS/ESM consumers,
  and native Chrome import/parsing/request checks passed. Both dependency audits and
  the dependency-usage checks are clean.
- Generated package output excluded from the patch. Live provider integration tests
  were not run; local verification used Node.js 24 and Chrome. Other runtime smoke
  checks remain covered by CI.
- PR #281 reviewed and merged as `c035f3e`; its eight regressions failed before the
  change and its 306 unit tests plus required GitHub CI passed after the change.
- Stage 5 completed: corrected explicit redirect ports and GET fallback bodies, added
  19 regressions, and documented the discovery behavior.
- Combined verification passed: 347 unit tests, 3 executable documentation tests,
  consumer type checks, lint, root type checking, and package/docs builds. Clearing
  the stale Docusaurus cache resolved the first incremental docs-build failure.
- PR and post-merge GitHub CI passed all seven jobs. Follow-up fixes remain local
  alongside the earlier review changes; generated package output is excluded.
- Stage 6 completed: release workflow now verifies fresh artifacts, lint, public
  consumers/examples, and dependency usage before publishing.
- A clean root-only install exposed an example-test dependency on the docs toolchain;
  Vitest now uses the root compiler settings. The original failure is resolved.
- Clean-snapshot verification passed: 347 unit tests, 3 executable documentation
  tests, consumer type checks, type checking, lint, dependency usage, package build,
  and packed-file inspection. The tarball contains 35 files and no test/source files.
- Packed CJS/ESM and mocked request checks passed on Node 18.20.8, 20.18.1, 22.21.1,
  and 24.11.1, Bun 1.3.14, Deno 2.9.4, and native Chrome. Both browser bundles also
  passed in a sandbox without Node globals. Both dependency audits remain clean.
- Recommend a 2.3.5 patch release. Version bump, committing/pushing the local changes,
  and CI on the final commit remain before publishing. No release was published;
  live provider verification was not run.
- Stage 7 authorized: preparing the 2.3.5 release with contributor credit, final
  artifacts, and CI verification before publication.
- Stage 7 candidate prepared: version bumped to 2.3.5, artifacts regenerated, and
  `@bensynapse` credited for PR #281 in the changelog and prepared release notes.
- Final candidate verification passed: 347 unit tests, 44 documentation tests,
  3 executable example tests, root/docs type checks and builds, lint, dependency
  usage, both audits, packed-file inspection, and packed CJS/ESM request checks.
- Release PR checks, merge, final main CI, and publication will be recorded in the
  GitHub release and its workflow runs.
