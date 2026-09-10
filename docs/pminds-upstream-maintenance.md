# Maintaining the pminds fork

`MapleTechLabs/maple` owns the product. `pminds/maple` carries only the changes
needed to run our installation. All sync PRs target **pminds/maple**, with
`mbirkegaard` reviewing; contributing upstream is a separate decision.

## Cadence

Check upstream weekly and prepare a sync PR while the delta is small. Expedite
security fixes. Keep one sync PR open at a time. Before changing dependencies,
check upstream first: its runtime, tooling, patches, and lockfile form one tested
set and should move together.

Use a merge commit for syncs, including the final GitHub merge. Do not squash or
rebase a sync PR: preserving upstream ancestry is what makes the next comparison
and merge useful. Never force-push main or use a fork-sync operation that discards
our commits.

```sh
git fetch upstream main
git fetch pminds main
git switch -c sync/upstream-YYYY-MM-DD pminds/main
git merge --no-ff upstream/main
# Resolve, validate, commit, and push the sync branch to pminds.
gh pr create --repo pminds/maple --base main --draft --reviewer mbirkegaard
```

Record the upstream SHA, surviving local patches, migrations, validation, and
rollout requirements in each PR. Review the delta against upstream separately
from the full incoming change. Retire each local workaround as soon as upstream
provides the equivalent behavior.

## Initial catch-up: 2026-09-10

Baseline: `59febc2f` (pminds), upstream: `7f3e97ec`. The fork is 734 commits behind
and three commits ahead. Upstream already carries Effect rc.112, Alchemy beta.74,
Effect tsgo, updated patches, and the published replacement for vendored LLM code.
Maple PR #5's old-beta compatibility assessment is superseded by this baseline;
reassess its small catalog cleanup after the sync instead of merging its old
lockfile or status document.

| Local customization               | Disposition                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Telemetry timestamp rounding      | Retire. Upstream preserves milliseconds for raw tables and uses seconds for rollups, with regression tests.                         |
| Web ClickHouse-builder build step | Retire. Upstream consumes a published package.                                                                                      |
| Container ports on 8080           | Retain if Railway hosting remains required.                                                                                         |
| API Node/Wrangler entrypoint      | Unresolved runtime dependency: upstream deleted `apps/api/wrangler.jsonc` in `9713fd87`. The old entrypoint cannot boot without it. |

The runtime decision gates merge readiness: either maintain a tested self-hosted
adapter, or retire the container customizations if this fork no longer serves an
installation. Do not restore the deleted config blindly; the Worker bindings and
initialization have evolved with the Alchemy stack.

## Acceptance and rollout

- Run the pinned Bun install, TypeScript checks, tests, lint and generated-artifact
  checks; require the aggregate CI result and applicable Rust/integration checks.
- If retaining containers, build and boot the actual images, then exercise health,
  authentication, a telemetry read and ingestion against disposable services.
- Review application database and ClickHouse migrations before rollout. Rehearse
  on a disposable copy, record backup/restore and rollback steps, and treat data
  migrations separately from reverting an image.
- Audit inherited deploy, release and scheduled workflows for our fork's intended
  targets and credentials before merging. A successful application test is not a
  deployment approval.
- Keep the initial catch-up as a draft until the runtime and migration gates are
  resolved. Do not deploy as part of synchronizing source history.

The weekly check should be read-only: compare both main branches and surface
missing commits. It must never auto-merge, deploy, rewrite history, or publish
upstream. Start with a manual weekly review; enable a scheduled check after this
catch-up establishes which installation we maintain.
