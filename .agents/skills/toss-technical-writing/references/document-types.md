# Document Types

Choose the type by the reader's purpose. The source guide divides technical documents into four broad types: learning, problem-solving, reference, and explanation. Types can be combined, but each page should still have one dominant job.

## Selection Heuristic

- "처음 접해서 흐름을 알고 싶다" -> learning document.
- "특정 기능을 구현하거나 작업을 끝내고 싶다" -> problem-solving document, usually a How-to guide.
- "이미 발생한 오류나 문제를 해결하고 싶다" -> problem-solving document, usually troubleshooting.
- "옵션, 메서드, 필드, 반환값이 궁금하다" -> reference document.
- "왜 등장했는지, 어떻게 동작하는지 깊이 이해하고 싶다" -> explanation document.

If the reader needs more than one type, compose pages intentionally. For example, a learning page can link to an explanation page for background and a reference page for API details.

## Learning Documents

Use when the reader is new to a technology or tool and wants a successful first path.

Core rules:

- Show clearly what the reader can do after reading.
- Let the reader proceed from beginning to end without getting stuck.
- Verify every example code path and document required setup.
- Explain steps in order, starting with simple examples and increasing difficulty gradually.
- Include runnable code that demonstrates the core feature.
- Keep the main path focused on a successful learning experience.

### Getting Started

Use for a first encounter with a tool or technology. Cover simple installation, setup, core flow, and essential concepts so the reader understands the whole shape.

### Tutorial

Use when there is a clear goal and concrete result. The reader should follow each step, run code, and learn concepts through the process.

Template:

1. Goal
2. Prerequisites
3. Step-by-step guide
4. Final result check
5. Next steps

When the page gets long, keep optional details, frequent issues, or advanced concepts in an FAQ or collapsible section after the core path.

## Problem-Solving Documents

Use when the reader has background knowledge and wants to complete a specific task or resolve a specific problem.

Core rules:

- Define the problem, task, or symptom clearly.
- Separate cause from observable symptom.
- Include error messages, logs, commands, settings, or code when they help readers recognize the issue.
- Provide immediately applicable solutions.
- Explain why the solution works when that helps the reader adapt it.
- Cover environment differences such as OS, library version, runtime, or configuration.

### How-To Guide

Use when the reader wants to implement a specific feature or complete a specific task. Focus on the procedure, not on teaching the whole tool.

Include:

1. Task goal
2. Required background or setup
3. Steps to complete the task
4. Runnable code, commands, or configuration
5. Verification method
6. Links to reference or explanation pages when the reader needs deeper detail

### Troubleshooting

Use when a problem already happened and the reader needs to diagnose and fix it.

Include:

1. Symptom or error message
2. Common causes
3. How to confirm the cause
4. Fixes in a practical order
5. Expected normal behavior after the fix
6. Environment-specific differences and related issues

Do not write troubleshooting as only an error dictionary. Explain enough background for the reader to understand and apply the fix.

## Reference Documents

Use when the reader already understands the basic flow and wants to quickly find exact information to apply: APIs, functions, components, configuration options, schemas, commands, or error codes.

Core rules:

- Prioritize accuracy, completeness, and freshness.
- Make search and scanning easy with consistent headings, tables, anchors, and keywords.
- Use the same section order across similar reference pages.
- Include practical examples that show realistic use.
- Put required preconditions near the top when readers need them before applying reference details, such as API keys, authentication, request headers, required packages, or environment constraints.

Template:

1. Overview: what this element is, when to use it, and what value it provides
2. Signature, syntax, or shape
3. Parameters, options, fields, or properties, including type, default, and required status
4. Return value, side effects, or error behavior
5. Usage examples, from basic to practical variants
6. Related APIs, constraints, and cautions

## Explanation Documents

Use when the reader wants deeper understanding of a concept, principle, background, architecture, domain, or tradeoff.

Core rules:

- Explain why the concept or technology appeared and what problem it solves.
- Share the reasoning or decision process, not only the final usage.
- Explain the core mechanism and mental model.
- Use diagrams, tables, flowcharts, or examples for complex concepts.
- State prerequisite knowledge when readers need it.
- Include domain explanations when the obstacle is domain understanding, not API usage.

Template:

1. Concept introduction
2. Background and problem
3. Core mechanism or operating principle
4. Visual explanation or concrete example when useful
5. Practical implications, tradeoffs, or decision criteria
6. Related concepts or next pages
