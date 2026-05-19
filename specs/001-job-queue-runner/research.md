# Research: Job Queue Runner

**Date**: 2026-05-18
**Branch**: `001-job-queue-runner`

## Decision 1: Testing Framework

**Decision**: Vitest

**Rationale**: Vitest runs TypeScript natively with zero configuration in a Node.js project.
It is significantly faster than Jest and does not require ts-jest or babel transforms. The
`vitest` and `@vitest/coverage-v8` packages cover unit testing and coverage reporting. It is
the modern standard for TypeScript CLI projects.

**Alternatives considered**:
- **Jest + ts-jest**: Well-established but requires extra configuration to handle TypeScript.
  Slower cold start. Rejected in favour of simpler setup.
- **Node.js built-in test runner (`node:test`)**: Zero dependencies, available since Node 18.
  Rejected because it lacks watch mode, coverage, and the snapshot/mock ergonomics that
  Vitest provides — all of which improve DX for this project over time.

---

## Decision 2: CSV Write-Back Strategy

**Decision**: `csv-stringify` (companion package to `csv-parse`)

**Rationale**: `csv-parse` is already installed for reading. `csv-stringify` is its official
companion for serialisation — it handles edge cases (quoting, special characters) correctly.
Reading and writing with the same library ensures round-trip fidelity. The alternative of
manual string construction risks corrupting rows that contain commas or newlines in field
values (e.g., a role title like "Engineer, Senior").

**Alternatives considered**:
- **Manual string reconstruction**: Zero extra dependency. Rejected because it does not
  handle quoted fields or embedded commas correctly without reimplementing csv-stringify.

---

## Decision 3: Profile Validation

**Decision**: Zod

**Rationale**: Zod provides TypeScript-first schema validation with automatic type inference.
A Zod schema for `Profile` doubles as the TypeScript type definition — no duplication. Error
messages are field-specific ("email: Required") which directly satisfies SC-004 (error message
must be specific enough to fix without documentation). One dependency, minimal API surface.

**Alternatives considered**:
- **Manual validation (if/else checks)**: Zero dependencies. Rejected because writing
  per-field error messages manually is verbose and brittle — adding a new field requires
  updating both the type and the validator.
- **AJV / JSON Schema**: More complex setup; better suited to API contracts than local file
  validation. Rejected as overkill.

---

## Decision 4: Terminal Prompt (Human Review Step)

**Decision**: Node.js built-in `readline` module

**Rationale**: The review prompt is a single yes/no question ("Submit this application?
[y/n]"). `readline` from the Node.js standard library handles this with no additional
dependencies. This directly satisfies Principle VI (Simplicity) — prefer built-ins.

**Alternatives considered**:
- **Inquirer**: Powerful interactive prompt library with checkbox, list, and confirm
  components. Rejected as overkill for a single binary prompt.
- **Prompts**: Lightweight alternative to Inquirer. Rejected for same reason — readline
  is sufficient and adds zero dependencies.
