# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

## Mandatory Agent Rules

- Code changes: always use the Ponytail skill before writing or editing code. Choose the smallest working change: reuse existing code, prefer platform and standard-library features, and avoid new abstractions or dependencies unless they are necessary.
- During planning and always before implementation, identify and design the relevant boundaries and contracts, then check the codebase for similar patterns before proceeding.
- Run all tests and builds with Node.js 22.
- Library, framework, SDK, API, CLI, or cloud-service documentation: use Context7 MCP before answering or implementing from docs. Start with `resolve-library-id`, then call `query-docs` with the selected library ID and the full question. If Context7 is unavailable, use the official documentation stored in this repository.
- If Ponytail is unavailable, or if neither Context7 nor relevant local official documentation is available, tell the user what is missing and guide them to install or enable it before continuing with work that requires it.
- Do not use Context7 for business logic debugging, code review, refactoring that does not require external docs, or project-specific docs under `docs/`.
- Service files must include a short comment above the exported service function or class explaining the use case boundary and what lower layer owns external I/O.

## Scratch / Temp Files

- Put every intermediate work artifact — planning/handoff notes, analysis dumps, PDF/text parsing output, one-off diagnose or migration-style scripts, throwaway SQL — under the repo-root `.scratch/` bin (git-excluded via `.git/info/exclude`). Do not scatter them across the repo root, `scripts/`, or `docs/`.
- Suggested layout: `.scratch/plans/`, `.scratch/hd-pdf/`, `.scratch/scripts/`; anything else loose at `.scratch/`.
- `.scratch/` is outside tsconfig/biome, so it never touches typecheck or CI. Run one-off scripts with their path, e.g. `pnpm payload run .scratch/scripts/<name>.ts`.
- Exceptions stay in their real homes: committed seed scripts in `scripts/` (see Content Provisioning), real docs in `docs/`. `.scratch/` is only for disposable personal work-in-progress.

## Database Schema Collaboration

When changing Payload collections, fields, indexes, relationships, or other database-backed model behavior:

### Required Default Workflow

1. During local schema development, use a disposable, isolated local Postgres database with `PAYLOAD_DB_PUSH=true`. Let Payload push each in-progress schema change; do not create or run migrations for every local iteration.
2. When the schema change is finished, generate the handoff migration on one designated machine with `pnpm migrate:create <name>`. Do this after all schema-changing branches are merged and before requesting PR review, merging, or updating any shared database. An unfinished draft PR may temporarily omit the migration, but it must remain draft.
3. Commit the schema source, generated migration `.ts`, matching drizzle snapshot `.json`, and `migrations/index.ts` together.
4. Do not run the generated migration against the same local database already updated by push. Verify it against a fresh database with `PAYLOAD_DB_PUSH=false`.
5. Keep CI, stage, production, and every shared or durable database on `PAYLOAD_DB_PUSH=false`; apply only committed migrations with `pnpm payload migrate` before starting the application.

- Commit the matching migration files with every finished schema change before review, merge, or shared-environment use.
- Commit the drizzle schema snapshot (`.json`) that `migrate:create` emits next to the `.ts`, and never delete snapshots; without them `migrate:create` regenerates the entire schema instead of an incremental diff.
- Do not rely on local automatic schema changes as the team handoff mechanism.
- On migration-driven databases, run pending migrations after pulling schema-related changes and before debugging local database errors.
- Do not manually patch a local database to match pulled code unless documenting a one-off recovery step.
- Breaking schema changes must be split into safe steps: expand, migrate/backfill, then contract.
- PRs that change schema without migrations are incomplete.
- Seed or fixture changes required by the new schema must be committed with the same change.

### Content Provisioning (data, not schema)

**콘텐츠의 정본은 DB다.** 가이드라인 문서·블록은 admin에서 고치면 그게 반영이고, 코드가 콘텐츠를 되돌려 쓰지 않는다. 옮겨야 할 것은 세 가지고 경로가 각각 다르다.

| | 누가 옮기나 | 확인 방법 |
|---|---|---|
| 스키마 | 마이그레이션(배포가 적용) | 배포 로그 · `migrate:status` |
| 레퍼런스 데이터 (`rules`·`brand-colors`처럼 코드가 요구하는 고정 데이터) | `scripts/`의 idempotent seed를 사람이 실행 | 실행 결과 |
| 콘텐츠 (문서·블록) | 🔴 **아무도 옮기지 않는다 — admin에서 직접 만든다** | 배포된 화면 |

- 콘텐츠를 코드로 되돌려 쓰는 seed를 **다시 만들지 말 것.** 2026-08-05에 삭제했다. 이유: 그 파이프라인의 목적("빈 DB에 콘텐츠 재현")이 애초에 성립하지 않았다 — 참조하는 업로드 170종 중 리포 보유가 27종이라 빈 DB에서는 어차피 못 만든다. 대신 양방향 덮어쓰기 위험·가드·모호성 처리를 전부 떠안고 있었다.
- 레퍼런스 데이터 seed는 계속 쓴다(예: `seed-brand-icons.ts`, `seed-agent-skills.ts`). 재실행 안전해야 하고(존재하면 건너뜀 또는 목표 상태로 수렴), 스키마가 필요하면 대상 DB에 마이그레이션을 먼저 적용한다.
- 🔴 **DB에 데이터를 쓰는 작업을 했으면 "어느 환경에 넣었고 어디엔 아직 안 넣었나"를 반드시 명시한다.** 데이터는 배포를 따라가지 않으므로 화면·PR·git 어디에도 안 나타난다. 이 명시가 유일한 기록이다.
- 실수로 덮었으면 Payload 버전 이력으로 복구한다: `_guideline_docs_v`에서 해당 시각의 버전 id를 찾아 `payload.restoreVersion({ collection, id })`. 환경 단위 복구는 Supabase PITR.
- 🔴 **문서의 부모를 바꾸거나 상태를 건드리는 update에는 `_status`를 명시한다.** autosave 초안 버전이 있는 문서는 update가 그 최신 버전 위에 얹혀 `_status=draft`를 따라 쓴다 → 게시 문서가 초안이 되어 사이트에서 사라진다(2026-08-05 실제 사고 2건).

#### 스냅샷 (읽기 전용, 한 방향)

`pnpm content:snapshot`(`scripts/export-guideline-content.ts`)이 `DATABASE_URL` 대상 DB의 게시 문서를 `scripts/data/guideline-content.json`으로 덮어쓴다. **DB → 코드 한 방향뿐이고 되돌려 쓰는 경로는 없다.**

- 목적은 복구가 아니라 **콘텐츠가 Postgres 한 곳에만 존재하지 않게 하고, 무엇이 언제 바뀌었는지 git으로 읽히게 하는 것**이다. 복구 수단은 PITR과 버전 이력이다.
- 관계는 사람이 읽을 수 있는 키로 적는다 — 업로드는 `{file: filename}`, `brand-colors`는 `{color: hex}`, `rules`는 `{rule: key}`. 원시 id는 환경마다 달라 스냅샷을 무의미하게 만든다.
- 부분 export는 없다(파일을 통째로 덮으므로 slug 인자를 거부한다). **엉뚱한 DB에 대고 돌렸는지는 `git diff`가 알려준다** — 문서가 대량으로 사라져 보이면 커밋하지 않는다.

### Local Machine Database Rules

- Treat every personal local Postgres database that uses `PAYLOAD_DB_PUSH=true` as disposable.
- Give each physical machine its own `DATABASE_URL`. Never point a desktop and laptop at the same push-enabled database.
- Give each concurrently running worktree its own database when `PAYLOAD_DB_PUSH=true`. A worktree that shares a database must use `push=false` and must not change the Payload schema.
- Keep each machine's `DATABASE_URL` and `PAYLOAD_DB_PUSH` in its untracked `.env.local`; never commit them.
- Use `PAYLOAD_DB_PUSH=true` only for isolated local development. Keep CI, stage, production, and any database with important shared data on `push=false`.
- After Payload has pushed schema changes to a local database, do not run `payload migrate` against that database. Recreate the database when committed migrations must be applied or verified.
- Git synchronizes source and migration files, not local CMS content. Transfer local data separately and in one direction if two machines must start with the same content.

Initialize a new or rebuilt local database from committed migrations before switching it to push mode:

```bash
pnpm install
PAYLOAD_DB_PUSH=false pnpm payload migrate
# Set PAYLOAD_DB_PUSH=true in this machine's .env.local.
pnpm dev
```

From then on, let Payload update that disposable database and do not mix in migration execution.

### Device Handoff Rules

- Use a work branch as the source handoff between a desktop and laptop. Commit and push before leaving one machine; fetch and pull before starting on the other.
- Do not edit the same branch on both machines concurrently. Use separate branches when concurrent work is unavoidable, then merge the source changes before creating migrations.
- A private handoff branch used only by one developer across personal machines may temporarily omit a migration while schema work is unfinished. Both machines must use separate disposable databases with `push=true`.
- Before requesting PR review, merging to `stage`, or updating a shared database, choose one machine to generate the final migration after all schema-changing branches are merged.
- Never generate competing migrations for the same unfinished schema change on both machines.

Normal device handoff flow:

```bash
# Leaving the current machine
git status
git push <remote> <work-branch>

# Starting on the other machine
git fetch <remote>
git switch <work-branch>
git pull --ff-only
pnpm install
pnpm dev
```

Finalize schema work on one machine only:

```bash
pnpm migrate:create <name>
pnpm check
pnpm typecheck
```

Review and commit the generated `.ts`, matching `.json` snapshot, and `migrations/index.ts` with the schema source. Do not run that migration against a local database already updated by push; verify it against a fresh database with `push=false`. Shared and durable environments must apply the committed migration with `pnpm payload migrate` before starting the application.

## Operating Principles

### 1. Think Before Coding

Do not assume or hide confusion. Surface tradeoffs before acting.

- State assumptions explicitly. If uncertain, ask rather than guess.
- Present multiple interpretations when ambiguity exists.
- Push back when a simpler approach exists.
- Stop when confused. Name what is unclear and ask for clarification.

### 2. Simplicity First

Write the minimum code that solves the problem. Add nothing speculative.

- Do not add features beyond what was asked.
- Do not add abstractions for single-use code.
- Do not add flexibility or configurability that was not requested.
- Do not add error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

The test: would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes

Touch only what is required. Clean up only your own mess.

- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- If unrelated dead code appears, mention it instead of deleting it.
- Remove imports, variables, and functions that your change made unused.
- Do not remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria and loop until verified.

- Turn imperative tasks into verifiable goals.
- For bug fixes, write or identify a check that reproduces the bug, then make it pass.
- For validation work, check invalid inputs and make the expected behavior pass.
- For refactors, verify behavior before and after.
- For multi-step tasks, state a brief plan with a verification step for each item.

Strong success criteria let agents work independently. Weak criteria like "make it work" require clarification.

## Project Context

This product, Living Brand System (LBS), turns brand guidelines into structured operational standards.
It manages guideline content, rules, brand resources, templates, plugins, work records, quality sessions, and usage event logs so brand standards can be used during production work and checked against outputs.

Keep implementation aligned with the docs instead of duplicating domain rules here. Before changing a flow, model, record, permission, or user-facing behavior, read the relevant doc and preserve the documented ownership boundaries.

Do not promote evolving domain details into this file unless they are stable rules for all future agents.

## Docs To Check

Always start from `docs/README.md`, then read the smallest relevant document before changing behavior, data, architecture, security, accessibility, i18n, or development rules:

- Product direction, users, service flow, and success assumptions: `docs/01-product.md`
- Workflow, actors, inputs, outputs, generated records, and next links: `docs/02-usecases.md`
- Data ownership, lifecycle, storage, retention, deletion, and immutable references: `docs/03-data-lifecycle.md`
- Domain boundaries, aggregates, entities, events, and cross-context references: `docs/04-domain-model.md`
- Modular monolith, request flow, Version/Snapshot/Event/Log strategy, Agent/Worker execution: `docs/05-system-architecture.md`
- Source layout, naming, comments, logging, exception handling, and coding style: `docs/06-project-structure.md`
- Auth, access control, upload/download, logging safety, Agent context limits, and operational security: `docs/07-security.md`
- Worker UI, custom Admin UI, user-facing copy, keyboard access, errors, and message/i18n placement: `docs/08-accessibility-i18n.md`
- Design tokens, color/typography/radius/dark mode, runtime brand override, and shell/frame skeleton — read before changing any front-end visual surface: `docs/09-design-system.md`
- Component authoring contract (reuse ladder, cva/data-size templates, style Do/Don't, kit→block promotion gate) — read before writing or adding any new UI component: `docs/10-component-authoring.md`

When docs conflict, prefer the newer or more specific document. If a code change intentionally departs from docs, update the relevant doc in the same change unless the user asked for source-only work.

## Branch Rules

- Layers: the ideal is `develop` / `stage` / `main`, but this repo does not run a `develop` branch yet. In practice:
  - `main`: the effective production target — the deployable, production-ready state, though nothing is deployed yet.
  - `stage`: the gateway to `main` — verify checks here, then merge to `main`. Currently identical to `main`; treat it as a rehearsal.
  - all other branches: feature development, filling the role a `develop` branch would; `develop` itself is unused here.
- Flow: merge normal work branches into `stage`, then promote verified `stage` to `main`.
- Base: branch from `stage` for normal product work. Branch from `main` only for urgent production fixes.
- Requirement: create or switch to a purpose branch before changing source code, product behavior, refactors, tests, tooling, dependencies, or non-trivial docs.
- Worktree default: when creating or opening a branch, create a new git worktree for it unless the user explicitly asks to use the current worktree.
- Protected branches: do not commit directly to `main` or `stage`; use them only as merge targets or promotion branches.
- Exception: trivial local-only edits may stay unbranched only when the user explicitly asks not to create a branch.
- Format: use `<type>/<short-kebab-purpose>`.
- Types:
  - `docs/` for documentation-only work.
  - `feat/` for new product behavior.
  - `fix/` for bug fixes.
  - `refactor/` for behavior-preserving code changes.
  - `test/` for test-only changes.
  - `style/` for formatting and lint-only changes.
  - `chore/` for tooling, dependency, or maintenance changes.
- Examples: `docs/update-guidelines`, `feat/review-page`, `fix/auth-access`, `chore/stage-db-migrations`.
- Scope: keep documentation-only changes separate from source code changes when practical.

## Commit Rules

- Format: use Conventional Commits with a Korean summary: `<type>: <한국어 요약>`.
- Types:
  - `docs:` for documentation changes.
  - `feat:` for user-facing product behavior.
  - `fix:` for bug fixes.
  - `test:` for test-only changes.
  - `refactor:` for behavior-preserving code changes.
  - `style:` for formatting and lint-only changes.
  - `chore:` for tooling, dependency, or maintenance changes.
- Scope: keep each commit focused on one purpose.
- Hygiene: do not include unrelated dirty worktree changes in a commit.
- Language: write commit messages in Korean unless an external tool requires English.

## Pull Request Rules

- Normal work PRs target `stage`.
- Promotion PRs target `main` from `stage`.
- Format PR titles like commits: `<type>: <한국어 요약>`.
- Use `chore: stage를 main으로 승격` for stage-to-main promotion PRs.
- Open a draft PR when CI, migration verification, or reviewer-ready cleanup is still pending.
- Keep one branch focused on one PR or work item. Do not reuse an old branch for unrelated follow-up work.

## Pull Request Description Rules

- Language: write pull request descriptions in Korean unless the user asks otherwise.
- Detail level: include enough detail for reviewers to understand what changed, why it changed, and how it was verified without reading the full diff first.
- Required sections: `요약`, `주요 변경사항`, `확인한 동작`, `검증`, and `참고` when relevant.
- Verification: list the exact commands run, not generic labels.
- Caveats: mention known warnings, intentionally skipped cleanup, or remaining review points briefly.
