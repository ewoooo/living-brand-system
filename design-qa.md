# Design QA: NavigationHeader transparent background

- Source: `/var/folders/sv/yv7g3gc948x836bgzcfmrhnh0000gn/T/codex-clipboard-730146ee-9465-4a5f-a303-3eed48258a05.png`
- Source dimensions: 2048 × 48 px
- Implementation: `http://localhost:3001/guideline`
- Target viewport: 2048 × 400 CSS px; header comparison region 2048 × 48 px
- State: desktop, light theme, `/guideline`

## Evidence

- `NavigationHeader.Root` uses `bg-header-background`.
- `--color-header-background` resolves to the semantic `--header-background` token.
- `--header-background` is `transparent` in both light and dark themes.
- Component test verifies that the header root carries the semantic background utility.

## Required surfaces

- Header background: transparent semantic token applied.
- Header group and button surfaces: unchanged.
- Typography, spacing, separators, copy, and icons: unchanged.

## Comparison history

1. Source reference was captured from the supplied 2048 × 48 screenshot.
2. Automated implementation capture was attempted at the matching 2048 px width.
3. The in-app browser blocked the local preview URL under its browser URL policy, so a paired visual comparison screenshot could not be produced.

## Final result

blocked
