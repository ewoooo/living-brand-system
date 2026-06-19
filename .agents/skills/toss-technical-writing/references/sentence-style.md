# Sentence Style

Use this checklist when drafting, editing, or reviewing Korean technical prose.

## Subject And Voice

- Make the actor clear. Avoid making tools, technologies, or systems the subject when a person or process is the real actor.
- Prefer active voice for instructions and procedures.
- Use passive voice only when the actor is unknown, irrelevant, or intentionally de-emphasized.
- When a command, code snippet, or setting is the trigger, write the resulting behavior clearly instead of personifying the tool.

Examples:

- Weak: "이 문서는 업데이트된 이후 다시 검토될 필요가 있습니다."
- Strong: "이 문서를 업데이트한 후 다시 검토하세요."

## Brevity

- Keep one sentence to one idea.
- Split long procedural sentences into sequential sentences.
- Remove metadiscourse that describes the writing instead of delivering the information: "앞서 설명했듯이", "이제 알아보겠습니다", "결론적으로", "아시다시피".
- Keep connective words only when they clarify order or cause.

## Concreteness

- Prefer verbs over nominalized nouns: "설정 수행", "검토 진행", "배포 처리" usually hide the action.
- Replace "진행", "수행", "처리", "적용" when the sentence can name the actual action.
- Replace vague qualifiers with exact conditions when possible: "일부 경우", "가능성이 있습니다", "필요할 수도 있습니다".
- Include who, what, where, and how when missing context would make the sentence ambiguous.
- Explain real behavior instead of jargon or literal translations of programming expressions.
- Do not translate programming expressions literally when the result is ambiguous. For example, instead of saying an API "throws an exception" in Korean without context, explain whether it returns an error, rejects a promise, stops execution, or passes the exception to the caller.
- Add measurable criteria: counts, thresholds, versions, environments, paths, status codes, command names, or expected outputs.
- When reusing a variable, option, or concept introduced elsewhere, point to the step or section where it came from or where it will be used.
- When a variable or value is created in one step and reused later, state both its origin and its later use.

## Natural Korean

- Prefer everyday Korean over stiff Sino-Korean when meaning stays precise.
- Replace translationese with natural expressions.
- Avoid English word order mapped directly into Korean.
- Keep technical terms in English only when that is the established term or improves searchability.
- Remove unnecessary Sino-Korean words when a simpler Korean expression preserves accuracy.

Examples:

- Weak: "해당 설정의 변경을 통해 문제 해결이 가능합니다."
- Strong: "이 설정을 변경하면 문제를 해결할 수 있습니다."

## Consistency

- Use official technical terms from the relevant product or ecosystem.
- Do not refer to the same concept by multiple names.
- Spell out abbreviations on first use, then use the abbreviation consistently.
- Choose loanword spelling by common usage and keep it consistent across the document.
- For loanwords, prefer the spelling used by official documentation or dominant reader usage. If usage differs, pick one spelling and apply it consistently.

## Review Checklist

- Can the reader identify the actor in every important sentence?
- Does each instruction say exactly what to do?
- Are vague words backed by specific conditions?
- Are long sentences split where the reader must perform multiple actions?
- Are repeated concepts named consistently?
- Does the Korean sound like a Korean technical writer wrote it, not a literal translation?
- Are values, variables, and references connected to where they came from and where they are used?
