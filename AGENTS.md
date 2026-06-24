# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

## Mandatory Agent Rules

- Code changes: always use the Ponytail skill before writing or editing code. Choose the smallest working change: reuse existing code, prefer platform and standard-library features, and avoid new abstractions or dependencies unless they are necessary.
- Library, framework, SDK, API, CLI, or cloud-service documentation: always use Context7 MCP before answering or implementing from docs. Start with `resolve-library-id`, then call `query-docs` with the selected library ID and the full question.
- If Ponytail or Context7 is unavailable, tell the user what is missing and guide them to install or enable it before continuing with work that requires it.
- Do not use Context7 for business logic debugging, code review, refactoring that does not require external docs, or project-specific docs under `docs/`.

## Project Context

This product turns brand guidelines into structured standards that can be used during work, checked against outputs, and reviewed through operational records.

Core actors:

- Manager: owns standards and final decisions.
- Worker: uses standards while creating outputs.
- System: stores workflow state, records, and references.
- Agent: assists with answers, checks, recommendations, and summaries.

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

- Layers: use `develop` for active work, `stage` for release validation, and `main` for stable production-ready state.
- Flow: merge feature and fix branches into `develop`, promote `develop` to `stage`, then promote verified `stage` to `main`.
- Base: branch from `develop` for normal product work. Branch from `main` only for urgent production fixes or docs that must bypass the development line.
- Requirement: create or switch to a purpose branch before changing source code, product behavior, refactors, tests, tooling, dependencies, or non-trivial docs.
- Worktree default: when creating or opening a branch, create a new git worktree for it unless the user explicitly asks to use the current worktree.
- Protected branches: do not commit directly to `main`, `stage`, or `develop`; use them only as merge targets or promotion branches.
- Exception: trivial local-only edits may stay unbranched only when the user explicitly asks not to create a branch.
- Format: use `<type>/<short-purpose>`.
- Types:
  - `docs/` for documentation-only work.
  - `feature/` for new product behavior.
  - `fix/` for bug fixes.
  - `refactor/` for behavior-preserving code changes.
  - `chore/` for tooling, dependency, or maintenance changes.
- Examples: `docs/update-guidelines`, `fix/auth-access`.
- Scope: keep documentation-only changes separate from source code changes when practical.

## Commit Rules

- Format: use Conventional Commits.
- Types:
  - `docs:` for documentation changes.
  - `feat:` for user-facing product behavior.
  - `fix:` for bug fixes.
  - `test:` for test-only changes.
  - `refactor:` for behavior-preserving code changes.
  - `chore:` for tooling, dependency, or maintenance changes.
- Scope: keep each commit focused on one purpose.
- Hygiene: do not include unrelated dirty worktree changes in a commit.
- Language: write commit messages in English.
