# Graph Report - /Users/plusx/Documents/hd-cms-prototype  (2026-06-24)

## Corpus Check
- 106 files · ~86,118 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 190 nodes · 190 edges · 21 communities (16 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 0% INFERRED · 1% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e24dc5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_importMap.js, Media.ts, Media|importMap.js, Media.ts, Media]]
- [[_COMMUNITY_biome.json, files, ignoreUnknown|biome.json, files, ignoreUnknown]]
- [[_COMMUNITY_tsconfig.json, compilerOptions, allowJs|tsconfig.json, compilerOptions, allowJs]]
- [[_COMMUNITY_payload-types.ts, Auth, Car|payload-types.ts, Auth, Car]]
- [[_COMMUNITY_scripts, build, check|scripts, build, check]]
- [[_COMMUNITY_dependencies, cross-env, dotenv|dependencies, cross-env, dotenv]]
- [[_COMMUNITY_devDependencies, @biomejsbiome, jsdom|devDependencies, @biomejs/biome, jsdom]]
- [[_COMMUNITY_package.json, description, engines|package.json, description, engines]]
- [[_COMMUNITY_settings.json, editor.codeActionsOnSave, source.fixAll.biome|settings.json, editor.codeActionsOnSave, source.fixAll.biome]]
- [[_COMMUNITY_admin.e2e.spec.ts, login.ts, login()|admin.e2e.spec.ts, login.ts, login()]]
- [[_COMMUNITY_route.ts, DELETE, GET|route.ts, DELETE, GET]]
- [[_COMMUNITY_settings.json, hooks, PreToolUse|settings.json, hooks, PreToolUse]]
- [[_COMMUNITY_Rule Configuration, React Doctor, Toss Technical Writing|Rule Configuration, React Doctor, Toss Technical Writing]]
- [[_COMMUNITY_layout.tsx, metadata, RootLayout()|layout.tsx, metadata, RootLayout()]]
- [[_COMMUNITY_next.config.ts, dirname, __filename|next.config.ts, dirname, __filename]]
- [[_COMMUNITY_launch.json, configurations, version|launch.json, configurations, version]]
- [[_COMMUNITY_extensions.json, recommendations|extensions.json, recommendations]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 19 edges
2. `compilerOptions` - 17 edges
3. `formatter` - 11 edges
4. `vcs` - 4 edges
5. `editor.codeActionsOnSave` - 3 edges
6. `enabled` - 3 edges
7. `files` - 3 edges
8. `linter` - 3 edges
9. `engines` - 3 edges
10. `pnpm` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Toss Technical Writing` --conceptually_related_to--> `Rule Configuration`  [AMBIGUOUS]
  .agents/skills/toss-technical-writing/SKILL.md → .agents/skills/react-doctor/references/explain.md
- `React Doctor` --references--> `Rule Configuration`  [EXTRACTED]
  .agents/skills/react-doctor/SKILL.md → .agents/skills/react-doctor/references/explain.md

## Import Cycles
- None detected.

## Communities (21 total, 5 thin omitted)

### Community 0 - "importMap.js, Media.ts, Media"
Cohesion: 0.08
Nodes (10): Media, Users, GET, OPTIONS, POST, Args, Args, Args (+2 more)

### Community 1 - "biome.json, files, ignoreUnknown"
Cohesion: 0.11
Nodes (21): files, ignoreUnknown, includes, formatter, formatWithErrors, indentStyle, indentWidth, lineWidth (+13 more)

### Community 2 - "tsconfig.json, compilerOptions, allowJs"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 3 - "payload-types.ts, Auth, Car"
Cohesion: 0.11
Nodes (19): Auth, Car, CarsSelect, CollectionsWidget, Config, GeneratedTypes, Media, MediaSelect (+11 more)

### Community 4 - "scripts, build, check"
Cohesion: 0.11
Nodes (18): scripts, build, check, check:write, ci, dev, devsafe, doctor (+10 more)

### Community 5 - "dependencies, cross-env, dotenv"
Cohesion: 0.17
Nodes (12): dependencies, cross-env, dotenv, graphql, next, @payloadcms/db-postgres, @payloadcms/next, @payloadcms/richtext-lexical (+4 more)

### Community 6 - "devDependencies, @biomejs/biome, jsdom"
Cohesion: 0.17
Nodes (12): devDependencies, @biomejs/biome, jsdom, @playwright/test, @testing-library/react, tsx, @types/node, @types/react (+4 more)

### Community 7 - "package.json, description, engines"
Cohesion: 0.20
Nodes (10): description, engines, node, license, name, packageManager, pnpm, onlyBuiltDependencies (+2 more)

### Community 8 - "settings.json, editor.codeActionsOnSave, source.fixAll.biome"
Cohesion: 0.22
Nodes (8): editor.codeActionsOnSave, source.fixAll.biome, source.organizeImports.biome, editor.defaultFormatter, editor.formatOnSave, js/ts.tsdk.path, js/ts.tsdk.promptToUseWorkspaceVersion, npm.packageManager

### Community 9 - "admin.e2e.spec.ts, login.ts, login()"
Cohesion: 0.39
Nodes (5): login(), LoginOptions, cleanupTestUser(), seedTestUser(), testUser

### Community 10 - "route.ts, DELETE, GET"
Cohesion: 0.29
Nodes (6): DELETE, GET, OPTIONS, PATCH, POST, PUT

### Community 12 - "Rule Configuration, React Doctor, Toss Technical Writing"
Cohesion: 0.67
Nodes (3): Rule Configuration, React Doctor, Toss Technical Writing

## Ambiguous Edges - Review These
- `Rule Configuration` → `Toss Technical Writing`  [AMBIGUOUS]
  .agents/skills/toss-technical-writing/SKILL.md · relation: conceptually_related_to

## Knowledge Gaps
- **125 isolated node(s):** `PreToolUse`, `recommendations`, `version`, `configurations`, `npm.packageManager` (+120 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Rule Configuration` and `Toss Technical Writing`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `paths` connect `tsconfig.json, compilerOptions, allowJs` to `importMap.js, Media.ts, Media`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts, build, check` to `dependencies, cross-env, dotenv`, `package.json, description, engines`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `recommendations`, `version` to the rest of the system?**
  _125 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `importMap.js, Media.ts, Media` be split into smaller, more focused modules?**
  _Cohesion score 0.082010582010582 - nodes in this community are weakly interconnected._
- **Should `biome.json, files, ignoreUnknown` be split into smaller, more focused modules?**
  _Cohesion score 0.10822510822510822 - nodes in this community are weakly interconnected._
- **Should `tsconfig.json, compilerOptions, allowJs` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._