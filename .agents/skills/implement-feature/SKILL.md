---
name: implement-feature
description: Implement approved features and fixes with the smallest practical set of readable, scalable changes. Use when the user explicitly asks Codex to implement, apply, create, or fix code and wants a simple solution that follows existing project patterns, documents changed behavior, and verifies the result.
---

# Implement Feature

Implement the user's approved design while keeping the diff narrow, readable,
and easy to maintain. Let the user retain control of unresolved product and
architecture decisions.

## Establish the Implementation Boundary

1. Read the relevant instructions, design notes, code, and tests before editing.
2. Identify decisions that materially affect behavior, data shape, security, or
   architecture. Ask the user only when such a decision remains unresolved.
3. State the files expected to change before editing.
4. Preserve unrelated work and avoid opportunistic refactors.

## Keep the Solution Minimal

- Change the fewest files that can correctly implement the feature.
- Follow existing project patterns when they are adequate.
- Prefer direct control flow and small functions over new abstraction layers.
- Add an abstraction only when the current feature needs it in more than one
  place or correctness clearly depends on it.
- Do not add speculative configuration, infrastructure, extensibility, or
  production hardening that the current feature does not require.
- Keep a reasonable path to scale without building that future path now.
- Write less code when the shorter version remains clear and correct.

## Write Readable Code

- Follow the standard conventions and formatter for the language in each file.
- Prefer simple structures, descriptive names, early returns, and shallow
  nesting.
- Avoid excessive type annotations, aliases, generics, and wrapper types when
  inference or a simpler type communicates the contract clearly.
- Keep short function signatures on one line when the formatter permits it.
- Use multiline parameter lists when required by line length or when they are
  materially easier to scan; do not split every parameter mechanically.
- Do not compress code merely to reduce line count when it harms readability.

## Add Intent Comments

- Add a concise one-line comment immediately above each function added or
  materially changed by the feature.
- Describe the function's responsibility in plain language, for example:
  `# Handles the data orchestration for loading Training HQ data from the database.`
- Add a similar one-line comment above a substantial code block when its
  purpose or orchestration is not immediately obvious.
- Comment intent, responsibility, or a non-obvious constraint. Do not narrate
  individual statements.
- Do not add comments to untouched functions solely because their file changed;
  that would expand the diff without implementing the feature.
- Use the language's normal comment syntax and established documentation style
  when a linter or project convention requires a docstring or documentation
  comment instead.

## Handle Dependencies Explicitly

- Prefer existing dependencies and platform capabilities.
- Before adding a new package, confirm that the feature cannot be implemented
  simply with what is already available.
- Tell the user in the implementation updates whenever code begins importing a
  new external library or a previously unused external package API. State why
  it is needed and where it is used.
- Do not treat imports from the repository itself as new external dependencies.

## Verify the Implementation

1. Review the diff for accidental scope growth and unnecessary files.
2. Run the narrowest relevant tests, type checks, lint checks, or formatters.
3. Expand verification only when the changed boundary or a failure justifies it.
4. Report any check that could not run and the concrete reason.

## Document Every File Change

In the final response, provide one concise entry for every changed file:

- Name the file.
- State exactly what changed and why it belongs in that file.
- Mention any new external import used there.
- State the verification relevant to the change.

Also list unresolved risks, assumptions, or follow-up decisions. Do not claim
completion when required behavior remains unverified.
