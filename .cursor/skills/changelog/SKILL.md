---
name: changelog
description: Write and update project CHANGELOG.md entries in English. Use when the user asks to add changelog updates, mentions CHANGELOG/CHNAGELOG, or asks to summarize recent modifications by version.
---

# Changelog

## Purpose

Keep `CHANGELOG.md` updated with clear English release notes.

## Rules

1. Always write changelog content in English.
2. If the user does not specify a version, use version `0.0.1`.
3. If the user specifies a version, add the new notes under that exact version section.
4. If the user asks to add changelog notes at the end of the agent chat, treat it as "add notes for this chat's modifications."
5. If the user does not specify what to include, use the most recent git modifications as the source of changelog notes.

## Workflow

1. Determine the target version:
   - Use user-provided version when available.
   - Otherwise default to `0.0.1`.
2. Determine the change source:
   - Prefer changes made in the current chat session.
   - If not explicitly specified, summarize the latest git modifications.
3. Update `CHANGELOG.md`:
   - Reuse existing format if present.
   - Create the target version section if missing.
   - Append concise bullet points grouped by meaningful categories when possible (for example: Added, Changed, Fixed).
4. Keep entries factual and user-facing:
   - Focus on behavior and outcomes, not internal noise.
   - Avoid empty or speculative notes.

## Output style

- English only.
- Concise and readable bullet points.
- Version-first structure in `CHANGELOG.md`.

## Defaults

- Default version: `0.0.1`
- Default scope when unspecified: most recent git modifications
