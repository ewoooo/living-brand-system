# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

## Mandatory Agent Rules

- Code changes: always use the Ponytail skill before writing or editing code. Choose the smallest working change: reuse existing code, prefer platform and standard-library features, and avoid new abstractions or dependencies unless they are necessary.
- Library, framework, SDK, API, CLI, or cloud-service documentation: always use Context7 MCP before answering or implementing from docs. Start with `resolve-library-id`, then call `query-docs` with the selected library ID and the full question.
- If Ponytail or Context7 is unavailable, tell the user what is missing and guide them to install or enable it before continuing with work that requires it.
- Do not use Context7 for business logic debugging, code review, refactoring that does not require external docs, or project-specific docs under `docs/`.
- Service files must include a short comment above the exported service function or class explaining the use case boundary and what lower layer owns external I/O.

## Database Schema Collaboration

When changing Payload collections, fields, indexes, relationships, or other database-backed model behavior:

- Commit the matching migration files with the source change.
- Commit the drizzle schema snapshot (`.json`) that `migrate:create` emits next to the `.ts`, and never delete snapshots; without them `migrate:create` regenerates the entire schema instead of an incremental diff.
- Do not rely on local automatic schema changes as the team handoff mechanism.
- After pulling schema-related changes, run pending migrations before debugging local database errors.
- Do not manually patch a local database to match pulled code unless documenting a one-off recovery step.
- Breaking schema changes must be split into safe steps: expand, migrate/backfill, then contract.
- PRs that change schema without migrations are incomplete.
- Seed or fixture changes required by the new schema must be committed with the same change.

Recommended local pull flow:

```bash
pnpm install
pnpm payload migrate
pnpm dev
```

For Payload/Postgres projects, prefer explicit migrations over implicit schema push. If the adapter supports `push: false`, keep schema updates migration-driven so every teammate and environment applies the same changes in the same order.

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

When docs conflict, prefer the newer or more specific document. If a code change intentionally departs from docs, update the relevant doc in the same change unless the user asked for source-only work.

## Branch Rules

- Layers: use `stage` for active integration and release validation, and `main` for stable production-ready state.
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
