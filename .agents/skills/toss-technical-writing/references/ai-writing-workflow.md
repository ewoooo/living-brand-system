# AI Writing Workflow

Use this workflow when drafting, reviewing, or improving documentation with AI assistance. Follow the source guide's sequence: decide the document type, build the information structure, then polish sentences.

## Step 1: Decide The Document Type

Collect or infer the minimum context:

- document goal, such as teaching a concept, configuring a tool, fixing an error, or documenting an API
- reader level, such as beginner, experienced user, or non-developer stakeholder
- project situation, such as new adoption, existing project improvement, urgent troubleshooting, or reference cleanup
- constraints, such as time pressure, need for visuals, OS/version differences, or required completeness

Choose one dominant type from `document-types.md`:

- learning: first flow, getting started, tutorial, successful learning path
- problem-solving: How-to guide or troubleshooting
- reference: exact API, option, parameter, return value, or example lookup
- explanation: background, principle, architecture, decision process, or domain understanding

If multiple types are needed, separate them into linked pages or explicitly combine them without obscuring the page's main job.

## Step 2: Build The Information Structure

Create or revise the outline before sentence polishing. Apply `information-architecture.md`.

Check these principles:

- One page should have one goal.
- The overview should summarize the core value and goal.
- The structure should be predictable and logically ordered.
- Value should come before setup cost, background, and detail.
- Titles should include core keywords and follow a consistent pattern.
- Cross-links should move optional detail to the right page instead of interrupting the main path.

When reviewing an outline or draft, return:

1. the document type and reader goal you inferred
2. the main structural problems
3. a revised outline or table of contents
4. one recommended structure that incorporates the useful options, not a scattered list of alternatives

## Step 3: Polish Sentences

Apply `sentence-style.md` after the structure is sound.

Check these principles:

- Keep only necessary information.
- Remove metadiscourse and filler.
- Make actors and actions clear.
- Prefer verbs over nominalized nouns.
- Replace vague expressions with specific conditions, values, paths, commands, versions, or expected results.
- Use natural Korean instead of translationese.
- Keep official technical terms, abbreviations, and loanword spelling consistent.

When reviewing sentences, return:

1. the key sentence-level issues
2. before -> after rewrites for concrete passages
3. missing facts needed for precision
4. a final revised version when enough source information is available

## Output Rule

Do not stop at abstract feedback. When the user asks for drafting or revision, synthesize the feedback into one good version that reflects the document type, structure principles, and sentence rules.
