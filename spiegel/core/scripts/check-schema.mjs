// Loads schema.sql into an in-memory SQLite database and inserts a sample row
// in every table, so a broken schema fails loudly. Requires Node 22.5+.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../src/schema.sql', import.meta.url), 'utf8'));

const t = '2026-10-27T08:00:00Z';
db.exec(`
  INSERT INTO learner VALUES ('l1', 'en', 1, '${t}', '${t}');
  INSERT INTO story VALUES ('s1', 'l1', '2026-10-27', 'I drank coffee.', NULL, 0, '${t}', '${t}');
  INSERT INTO story_version VALUES ('v1', 's1', 1, 1, '${t}');
  INSERT INTO sentence VALUES ('x1', 'v1', 0, 'I drank coffee.', '[]');
  INSERT INTO item VALUES ('i1', 'l1', 'lemma', 'Kaffee', 'noun', 'm', 'Kaffees', 'coffee', 1, 's1', 0, '${t}');
  INSERT INTO occurrence VALUES ('i1', 'x1', 1, 'Kaffee');
  INSERT INTO review_state VALUES ('i1', 'new', 0, 0, 0, 0, '${t}', NULL);
  INSERT INTO attempt VALUES ('a1', 'l1', 's1', 'i1', 'choose', 1, 'gender', 'Kaffee', 'Kaffee', 1, '${t}');
`);

// Constraints must reject bad data.
for (const bad of [
  `INSERT INTO learner VALUES ('l2', 'en', 9, '${t}', '${t}')`,
  `INSERT INTO item VALUES ('i2', 'l1', 'lemma', 'Tee', 'noun', 'x', NULL, 'tea', 1, NULL, 0, '${t}')`,
  `INSERT INTO occurrence VALUES ('missing', 'x1', 2, 'Tee')`,
  `INSERT INTO item VALUES ('c1', 'l1', 'chunk', 'Guten Morgen', NULL, NULL, NULL, 'good morning', 2, NULL, 0, '${t}');
   INSERT INTO item VALUES ('c2', 'l1', 'chunk', 'Guten Morgen', NULL, NULL, NULL, 'good morning', 2, NULL, 0, '${t}')`,
]) {
  let rejected = false;
  try { db.exec(bad); } catch { rejected = true; }
  if (!rejected) throw new Error(`Constraint did not reject: ${bad}`);
}

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
console.log('schema ok:', tables.map((r) => r.name).join(', '));
