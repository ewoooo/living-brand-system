# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

Before changing product behavior, architecture, domain models, security, accessibility, i18n, or development rules, read `docs/README.md` and the relevant document under `docs/`.
For implementation work, use the Ponytail skill and choose the smallest working change: reuse existing code, prefer platform and standard-library features, and avoid new abstractions or dependencies unless they are necessary.

## Branch Rules

- Base: use `main` as the stable base branch.
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
