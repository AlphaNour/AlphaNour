# Structure 2 — Data Model

## Decision: local-first

All learner data lives **on the Android phone** in SQLite (`expo-sqlite`).
The backend (Structure 3) is stateless: it receives a story, returns woven
sentences, and stores nothing. This means:

- Fade reviews and the word bank work **offline**.
- Your stories stay private on your phone.
- No user accounts or server database needed for v1.

Cloud backup/sync can be added later without changing these tables.

## Tables

```
learner ─┬─< story ─< story_version ─< sentence ─< occurrence >─ item ─ review_state
         ├─< item
         └─< attempt (→ story, → item)
```

| Table | One row is… | Key fields |
|---|---|---|
| `learner` | you | `stufe`, `stufe_started_at` |
| `story` | one true day you told | `source_text` (English), `fade_level` 0–4, `next_fade_at` |
| `story_version` | that story woven at one Stufe | `stufe`, `is_current` — a new version is created at F4 retell |
| `sentence` | one sentence of a version | `english_text`, `segments` (JSON) |
| `item` | one word-bank entry (lemma or chunk) | `german`, `gender`, `english`, `mastery` 0–5 |
| `occurrence` | where an item appears in a sentence | `surface_form` (e.g. *den Kaffee*) |
| `review_state` | FSRS memory state for an item | `stability`, `difficulty`, `due_at` |
| `attempt` | one answer you gave | `task`, `grammar_tag`, `correct` |

## Segments: how a woven sentence is stored

A sentence is a list of English and German pieces. German pieces carry the
grammar the screen needs to draw colors, role icons and the verb bracket:

```json
[
  { "kind": "en", "text": "I drank " },
  { "kind": "de", "text": "Kaffee", "itemId": "item-kaffee", "english": "coffee",
    "gender": "m", "isNew": true },
  { "kind": "en", "text": "." }
]
```

At Stufe 5 the same structure carries `case` (🎯) and `bracketId`: two verb
pieces with the same `bracketId` (*habe … getrunken*) are drawn as one arc.

## How the spec maps to data

| Spec rule | Where it lives |
|---|---|
| Stufen ladder, unlocks, max new items | `core/src/stufen.ts` → `STUFEN` |
| Gender colors, case role icons | `GENDER_COLOR`, `CASE_ROLE` |
| Fade schedule (day 0/1/3/7/14) | `FADE_SCHEDULE` + `story.next_fade_at` |
| Mastery 0–5 | `item.mastery`, updated from `attempt` |
| Level-up rule 1 (80% mastery ≥ 3) | `item` where `introduced_stufe = learner.stufe` |
| Level-up rule 2 (8 of last 10 grammar uses) | `attempt` filtered by `grammar_tag` |
| Level-up rule 3 (7 days min) | `learner.stufe_started_at` |

## Files

- `core/src/schema.sql` — the SQLite schema
- `core/src/types.ts` — TypeScript types shared by app and backend
- `core/src/stufen.ts` — the method spec as data
- `core/src/fixtures.ts` — the spec's worked example as test data
- `core/scripts/check-schema.mjs` — loads the schema and checks constraints (`npm run check:schema`)
