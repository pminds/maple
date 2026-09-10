# Effect compatibility review

Reviewed 2026-09-10 against `pminds/main` at `59febc2f`.

## Safe changes

Move the remaining Node platform and Vitest declarations into `catalogs.effect`, so the root,
electric-sync, scraper, unitflow, and auth use the same version source as the rest
of the workspace. The lockfile changes no resolved package version.

The trial upgrade of `@effect/language-service` from locked 0.86.6 to 0.87.2
passed workspace typechecks and tests, but its diagnostics do not support the
repository's TypeScript 7.0.2. Its CLI rejects TypeScript 7 and the diagnostics
path cannot load `typescript/lib/tsserverlibrary`. This limitation also exists
in 0.86.6. Keep the current pin until an explicit `@effect/tsgo` migration or a
supported side-by-side TypeScript 5/6 editor host is configured and verified.
A package version bump alone would not fix the diagnostic path.

## Runtime stays on beta.101

Do not replace the runtime catalog with the newest RC yet:

- **MCP sessions:** our Effect patch exposes `clientSessions` for KV-backed
  recovery in `apps/api/src/mcp/lib/session-store.ts`. A dry-run against beta.102
  already rejects the runtime hunk; rc.112 rejects all six MCP hunks. The new
  internal protocol/session state is not compatible with the persisted
  initialization-payload map. Removing the patch would break sessions across
  worker instances. Migrate storage and add cross-instance resume/expiry tests
  before upgrading.
- **Alchemy:** installed `alchemy@2.0.0-beta.64` calls
  `Schema.TaggedErrorClass` in its compiled auth, access, worker-validation, and
  bundle modules. That API is absent in beta.107 and rc.111/112. Upgrade Alchemy
  to a verified compatible release together with its patches and the Effect
  catalog. Permissive peer ranges are not proof of runtime compatibility.
- **Published declarations:** rc.113 is the newest RC but fails strict declaration
  checking ([issue #8161](https://github.com/Effect-TS/effect/issues/8161),
  [pending fix #8162](https://github.com/Effect-TS/effect/pull/8162)). Parseu's
  independently tested upgrade stops at rc.112 for that reason.

The shared Redacted registry patch is still required and remains intact. The
vendored `lib/llm` error constructors also need migration when the runtime moves;
record those changes in its upstream-sync transform rather than reformatting it.
Keep core, platform, atom, SQL, and Vitest versions coordinated at that point.

## Scope and validation

The workspace-wide manifest scan found two active Effect roots: Maple and
`parseu-inference-api`. Parseu PRs
[#30](https://github.com/pminds/parseu-inference-api/pull/30) and
[#29](https://github.com/pminds/parseu-inference-api/pull/29) contain the verified
rc.112 migration and OpenAPI compatibility fix. The Python services, inference
stack, audio tooling, retired prototype, and standalone Slack agent declare no
Effect dependency. Maple's `.context` trees are reference snapshots outside the
Bun workspace; changing their manifests would not upgrade a running application.

Validated with Bun 1.3.11 and Node 24.18.0: frozen installation, all TypeScript
workspace typechecks and package tests (59 Turbo tasks, including dependency
builds), plus the root Alchemy typecheck. Existing opt-in integration tests remain
skipped. Rust and external-service validation are outside this dependency change.
The 0.87.2 language-service trial was reverted after the diagnostic compatibility check.

Sources: [Effect registry](https://registry.npmjs.org/effect),
[rc.112 release](https://github.com/Effect-TS/effect/releases/tag/effect%404.0.0-rc.112),
[rc.113 release](https://github.com/Effect-TS/effect/releases/tag/effect%404.0.0-rc.113),
[language-service](https://github.com/Effect-TS/language-service).
