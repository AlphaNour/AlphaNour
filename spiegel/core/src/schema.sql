-- Spiegel on-device database (SQLite via expo-sqlite).
-- Local-first: everything lives on the phone; the backend only runs AI calls.

PRAGMA foreign_keys = ON;

-- The learner (one per device in v1).
CREATE TABLE learner (
  id                TEXT PRIMARY KEY,
  helper_language   TEXT NOT NULL DEFAULT 'en',
  stufe             INTEGER NOT NULL DEFAULT 1 CHECK (stufe BETWEEN 1 AND 8),
  stufe_started_at  TEXT NOT NULL,              -- ISO 8601
  created_at        TEXT NOT NULL
);

-- One true story told on one day, in the helper language.
CREATE TABLE story (
  id            TEXT PRIMARY KEY,
  learner_id    TEXT NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  told_on       TEXT NOT NULL,                  -- YYYY-MM-DD
  source_text   TEXT NOT NULL,                  -- what the learner said (English)
  audio_uri     TEXT,                           -- local recording, optional
  fade_level    INTEGER NOT NULL DEFAULT 0 CHECK (fade_level BETWEEN 0 AND 4),
  next_fade_at  TEXT,                           -- when the next fade is due
  created_at    TEXT NOT NULL
);
CREATE INDEX story_next_fade ON story(next_fade_at);

-- A woven rendering of a story at a given Stufe. A story gets a new version
-- when it is retold at F4 at a higher Stufe.
CREATE TABLE story_version (
  id          TEXT PRIMARY KEY,
  story_id    TEXT NOT NULL REFERENCES story(id) ON DELETE CASCADE,
  stufe       INTEGER NOT NULL CHECK (stufe BETWEEN 1 AND 8),
  is_current  INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
  created_at  TEXT NOT NULL
);
CREATE INDEX story_version_story ON story_version(story_id);

-- One sentence of a version. `segments` is JSON: Segment[] (see types.ts).
CREATE TABLE sentence (
  id            TEXT PRIMARY KEY,
  version_id    TEXT NOT NULL REFERENCES story_version(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  english_text  TEXT NOT NULL,                  -- the plain English meaning
  segments      TEXT NOT NULL,                  -- JSON
  UNIQUE (version_id, position)
);

-- The word bank: German lemmas and fixed chunks the learner has met.
CREATE TABLE item (
  id                   TEXT PRIMARY KEY,
  learner_id           TEXT NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  kind                 TEXT NOT NULL CHECK (kind IN ('lemma', 'chunk')),
  german               TEXT NOT NULL,           -- dictionary form: 'Kaffee', 'trinken', 'Guten Morgen'
  pos                  TEXT,                    -- noun | verb | adj | adv | pron | prep | other
  gender               TEXT CHECK (gender IN ('m', 'f', 'n', 'pl')),
  plural               TEXT,                    -- nouns only
  english              TEXT NOT NULL,
  introduced_stufe     INTEGER NOT NULL,
  first_story_id       TEXT REFERENCES story(id) ON DELETE SET NULL,
  mastery              INTEGER NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 5),
  created_at           TEXT NOT NULL
);
-- Chunks have no gender; COALESCE keeps NULLs from bypassing uniqueness.
CREATE UNIQUE INDEX item_unique ON item(learner_id, kind, german, COALESCE(gender, ''));

-- Where an item appears: links the word bank to sentence segments.
CREATE TABLE occurrence (
  item_id        TEXT NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  sentence_id    TEXT NOT NULL REFERENCES sentence(id) ON DELETE CASCADE,
  segment_index  INTEGER NOT NULL,
  surface_form   TEXT NOT NULL,                 -- as written: 'den Kaffee', 'getrunken'
  PRIMARY KEY (sentence_id, segment_index)
);
CREATE INDEX occurrence_item ON occurrence(item_id);

-- FSRS spaced-repetition state, one row per item.
CREATE TABLE review_state (
  item_id         TEXT PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
  state           TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  stability       REAL NOT NULL DEFAULT 0,
  difficulty      REAL NOT NULL DEFAULT 0,
  reps            INTEGER NOT NULL DEFAULT 0,
  lapses          INTEGER NOT NULL DEFAULT 0,
  due_at          TEXT NOT NULL,
  last_review_at  TEXT
);
CREATE INDEX review_state_due ON review_state(due_at);

-- Every answer the learner gives. Feeds mastery, FSRS and level-up rule 2.
CREATE TABLE attempt (
  id           TEXT PRIMARY KEY,
  learner_id   TEXT NOT NULL REFERENCES learner(id) ON DELETE CASCADE,
  story_id     TEXT REFERENCES story(id) ON DELETE SET NULL,
  item_id      TEXT REFERENCES item(id) ON DELETE SET NULL,
  task         TEXT NOT NULL CHECK (task IN ('choose', 'recall', 'produce', 'retell', 'speak')),
  fade_level   INTEGER CHECK (fade_level BETWEEN 0 AND 4),
  grammar_tag  TEXT,                            -- 'gender' | 'akk' | 'perfekt' | ... (GrammarTag)
  expected     TEXT NOT NULL,
  given        TEXT NOT NULL,
  correct      INTEGER NOT NULL CHECK (correct IN (0, 1)),
  created_at   TEXT NOT NULL
);
CREATE INDEX attempt_learner_time ON attempt(learner_id, created_at);
CREATE INDEX attempt_grammar ON attempt(learner_id, grammar_tag);
