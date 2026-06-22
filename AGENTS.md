# Agents

This project uses the Payload CMS skill at `.agents/skills/payload/`.
Start with `.agents/skills/payload/SKILL.md` for a quick reference, then see `.agents/skills/payload/reference/` for detailed docs.

## Branch Strategy

- Use `main` as the stable base branch.
- Create task branches with a work-type prefix.
- Use `docs/` for documentation-only work.
- Use `feature/` for new product behavior.
- Use `fix/` for bug fixes.
- Use `refactor/` for behavior-preserving code changes.
- Use `chore/` for tooling, dependency, or maintenance changes.
- Use short, purpose-based branch names, for example `docs/update-guidelines` or `fix/auth-access`.
- Keep documentation-only changes separate from source code changes when practical.

## Commit Rules

- Use Conventional Commits.
- Prefer these commit types:
  - `docs:` for documentation changes.
  - `feat:` for user-facing product behavior.
  - `fix:` for bug fixes.
  - `test:` for test-only changes.
  - `refactor:` for behavior-preserving code changes.
  - `chore:` for tooling, dependency, or maintenance changes.
- Keep each commit focused on one purpose.
- Do not include unrelated dirty worktree changes in a commit.
- Write commit messages in English.
