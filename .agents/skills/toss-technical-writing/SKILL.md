---
name: toss-technical-writing
description: Draft, revise, review, or structure Korean developer documentation using Toss technical-writing principles. Use when writing or improving README files, developer guides, tutorials, troubleshooting docs, API/reference docs, conceptual explanations, release notes, help text, or Korean technical prose that should be clear, concrete, action-oriented, and easy to scan.
---

# Toss Technical Writing

Use this skill to write Korean technical documentation that helps readers solve a problem or reach a goal quickly. Optimize for clarity, concrete action, predictable structure, and natural Korean.

Source basis: toss/technical-writing, "개발자를 위한 글쓰기 기본기" (CC BY-NC-SA 4.0), checked against `master@68ba335`. This skill summarizes and operationalizes the guidance instead of copying the source.

## Workflow

1. Identify the reader, their goal, and the document type.
2. Choose the information structure before polishing sentences.
3. Draft or revise from the reader's path: value first, cost later.
4. Polish sentences for subject, brevity, concreteness, natural Korean, and terminology consistency.
5. Return a single improved draft when enough source information exists. If reviewing, include concrete feedback and rewrites, then synthesize the best version instead of leaving only abstract advice.

## Load References

- For sentence-level editing, read `references/sentence-style.md`.
- For page or multi-page structure, read `references/information-architecture.md`.
- For choosing a document type or template, read `references/document-types.md`.
- For AI-assisted drafting/review prompts, read `references/ai-writing-workflow.md`.

## Core Rules

- State the reader's goal early. Do not start with background unless the background is needed to act.
- Put the most useful outcome before setup cost, caveats, and implementation details.
- Prefer one topic per page and one thought per sentence.
- Use explicit actors and active voice when possible.
- Replace vague nouns and nominalized expressions with verbs.
- Add concrete conditions, numbers, paths, commands, environment names, or version constraints when they materially affect behavior.
- Keep terminology consistent. Define abbreviations before using them.
- Write in natural Korean. Avoid stiff translationese and unnecessary Sino-Korean wording.

## Output Patterns

When drafting a document, include:

- a concise title with the core keyword
- an overview that says what the reader can do after reading
- prerequisites only when they are necessary
- steps or sections in the order the reader will need them
- runnable code or commands when the document asks the reader to act
- verification or expected result after risky or multi-step work
- links to deeper context instead of interrupting the main path

When reviewing a document, lead with:

- the inferred document type and reader goal
- the highest-impact structural issue
- sentence-level problems with concrete rewrites
- missing information that blocks reader success
- terminology or consistency issues

Prefer rewriting the problematic passage directly over explaining abstract style rules.
