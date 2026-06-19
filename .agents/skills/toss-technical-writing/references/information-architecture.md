# Information Architecture

Use this reference when structuring a page or a multi-page documentation set.

## Page Principles

- Cover one primary topic per page.
- If heading depth reaches H4 or deeper, consider splitting the page.
- Make the title specific and keyword-rich.
- Keep titles concise, ideally under about 30 Korean characters when possible.
- Use parallel heading patterns at the same level.
- Use declarative titles instead of exclamation or question-mark hooks.
- For procedures, number headings when sequence matters.
- Include an overview that summarizes the document's value and goal.
- Put the overview directly under the title before the body starts.
- Put value before cost: show what the reader can achieve before listing setup, background, caveats, or details.
- Make the structure predictable by repeating section patterns across similar pages.
- Order information logically: goal -> prerequisites -> steps -> expected result -> deeper context.
- Add enough background when a new concept appears or a feature's operation is hard to infer, but keep it out of the critical path if it interrupts action.

## Multi-Page Structure

Start by designing the navigation, not individual pages. Think of it as drafting the left-side navigation first. Decide which reader intents need their own pages, then place pages in a logical hierarchy.

Group pages by reader intent:

- `get-started.md`: fastest path to first success
- `tutorials/`: learning-oriented walkthroughs
- `how-tos/`: goal-oriented guides
- `explanations/`: concepts, background, architecture, tradeoffs
- `reference/`: APIs, options, schemas, error codes
- `troubleshooting.md`: known failures and fixes
- `glossary.md`: terms that appear across documents

Do not force every project into this exact tree. Combine document types when that helps the reader, but avoid hiding multiple unrelated goals on one page. Use the smallest structure that lets the reader find the next useful page.

When a tutorial needs advanced detail, move the detail to a How-to, explanation, or reference page and link to it. When a reference page needs usage context, link back to tutorials or examples.

## Cross-Links

- Link from tutorials to deeper how-to, explanation, or reference pages when extra detail would distract from the main path.
- Link from references back to tutorials or examples when readers need usage context.
- Link between related problem-solving pages when symptoms or fixes overlap.
- Name links by the destination's value, not by vague labels like "here".

## Heading Checklist

- Does the title include the keyword the reader would search for?
- Does the title make the page purpose clear without asking the reader to guess?
- Are same-level headings written in the same style, such as all noun phrases or all `~하기` forms?
- Are procedure headings numbered when order matters?
- Is every heading short enough to scan?

## Structural Review Checklist

- Is the first screen enough to know whether the document is useful?
- Does the document answer the reader's likely first question before secondary details?
- Are prerequisites complete but not bloated?
- Are steps in the order the reader performs them?
- Are expected results visible after commands or risky operations?
- Could any section become a separate page?
- Are related pages connected where the reader will need them?
- Does the page put background after the reader-facing value unless background is required first?
