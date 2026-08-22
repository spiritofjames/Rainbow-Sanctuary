# content-research — source-scoped website evidence

Purpose: research approved content, links, accessibility, or provenance questions
and return cited findings without changing production source.

## Inputs
- Working: the exact task and named root pages or data files.
- Reference: `../../../docs/` and approved public/canonical sources.

## Process
1. Inspect only the named sources.
2. Separate extracted facts, unresolved questions, and recommendations.
3. Write a cited findings artifact.

## Outputs
- `findings.md` → `output/`.

## Delegation contract
- Parent supplies: task, source paths, constraints, and output name.
- Return: artifact path, concise findings, and unresolved questions.
- Parallel-safe when: source sets and output files are separate.
- Not parallel-safe when: another task writes the same report.

## Run boundary
- Default: stop after returning the findings artifact.
- Resume when: the parent or reviewer approves the next bounded task.

## Human gate
- Reviewer: content or domain owner.
- Decision: approve, revise, or stop before findings become implementation inputs.
