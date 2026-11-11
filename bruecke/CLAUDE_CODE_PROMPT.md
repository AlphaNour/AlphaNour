# Prompt for Claude Code: build "Brücke"

Put `prototype.html` (from this folder) next to your two German books. Open Claude Code in that folder
and paste everything below the line. If the filenames differ, change them in **0. Inputs**.

---

# Build "Brücke": a German app that uses English as the bridge (Null → A2)

You are building a web app that takes an English speaker from zero German to A2. The method:
the learner already knows English, so we lean on cognates and sound-shift rules (water → Wasser,
ship → Schiff, night → Nacht), and on **whole English sentence translations** instead of single-word
glossaries. Every noun is learned with its article, its plural, a rule that explains the article, and one
longer sentence that uses both the singular and the plural.

`prototype.html` is the approved design and behaviour reference. **Open it in a browser and read its source
before you write any code.** The app must look and behave like the prototype, screen by screen. Wherever
this prompt and the prototype disagree, this prompt wins. Do not reuse the prototype's inline word list:
the real data comes from the books (section 1).

## 0. Inputs

- `BOOK_A0.1` → the first coursebook (level A0.1). Exact filename: `<BOOK_1>`
- `BOOK_A1.1` → the second coursebook (level A1.1). Exact filename: `<BOOK_2>`
- `prototype.html` → the UI reference

Start by listing the folder and printing each book's table of contents (lesson numbers and titles).
**Stop and show me the lesson list** before you extract anything.

## 1. Vocabulary pipeline (build this first)

Write the scripts in `scripts/` (Node + TypeScript or Python). They must be re-runnable and deterministic.

### 1.1 Extract in book order
1. Extract the text page by page (`pdftotext -layout` or `pdfplumber`; OCR with `tesseract -l deu` if pages are scanned).
2. Detect the lesson boundaries from the table of contents and the page headers. Each page belongs to one
   `book` (`A0.1` or `A1.1`) and one `lesson` (number + German title).
3. Find every noun with its article: running text (`der|die|das` + a capitalised word) and the vocabulary
   lists coursebooks use (`Haus, das, -¨er` · `das Haus, Häuser` · `die Lampe, -n`). Record `book`,
   `lesson`, `page` and **first-appearance order**.

### 1.2 Chunk chronologically
- A word belongs to the lesson where it **first appears**. Later appearances don't move it.
- Within a lesson, keep the order of first appearance.
- If a lesson has more than 12 nouns, split it into parts of 8–12: `A0.1 · L3 · Teil 1`, `Teil 2`.
- Lesson order is A0.1 L1 → last A0.1 lesson → A1.1 L1 → last A1.1 lesson. This order drives the
  Lessons screen, the "Next up" badge and the default card order.
- Then **add the core A1/A2 nouns the books don't cover**, so the deck covers the official A1–A2 scope (target:
  1,000–1,400 nouns in total). Put each one in an "Extra" chunk after the book lesson whose topic fits best
  (`A1.1 · L4 · Extra`), with `source.book = "core"`.

### 1.3 Data schema → `src/data/words.json`
```ts
type Word = {
  id: string;                    // "das-haus"
  article: "der" | "die" | "das";
  word: string;                  // "Haus"
  plural: string | null;         // "Häuser" (no article); null = no plural
  pluralType: "-" | "¨" | "e" | "¨e" | "er" | "¨er" | "n" | "s" | "other"; // computed, see 2.2
  lesson: string;                // "A0.1-1" (or "A0.1-3b" for a split part)
  order: number;                 // global first-appearance order
  level: "A1" | "A2";
  topic: string;                 // German topic: "Wohnen", "Essen", "Verkehr" …
  icon: string;                  // a Lucide icon name that EXISTS in the installed version
  bridge?: string;               // "house · ou → au"
  falseFriend?: string;          // "Careful: das Gift means poison, not gift."
  meaningRule?: { article: "der"|"die"|"das"; label: string };  // e.g. der · "Male professions"; overrides the ending rules
  sentence: string;              // German, 15–25 words, with markers (see 1.4)
  case: { case: "N"|"A"|"D"|"G"; why: string };  // case of the [singular] phrase, see 1.4
  translation: string;           // natural English translation of the WHOLE sentence
  source: { book: "A0.1"|"A1.1"|"core"; lesson?: string; page?: number };
};
type Lesson = { id: string; book: "A0.1"|"A1.1"; n: number; part?: string; title: string };
```

### 1.4 Sentence rules (the heart of the app)
- Use the singular **and** the plural in natural, everyday German at the lesson's level. Reuse
  words from earlier lessons so learners see them repeatedly.
- Mark the singular phrase with `[…]`, determiner included, and the plural phrase with `{…}`.
- **Write a good share of sentences where the singular is not in the nominative** (at least 40% Akkusativ or
  Dativ). Use triggers like `mit / zu / aus / von / bei / nach` (+Dativ), `ohne / für / durch` (+Akkusativ),
  two-way prepositions (`in / auf / unter / neben…`: wo? → Dativ, wohin? → Akkusativ), and verbs like
  `helfen / danken` (+Dativ). These sentences feed the case lens (3.6).
- Every `[…]` phrase gets `case` plus a short `why` a beginner can understand:
  `"D" · "mit always takes Dativ."` · `"A" · "in + movement (wohin? where to?) takes Akkusativ."` ·
  `"N" · "After sein (war), the noun stays Nominativ."`
- A `{…}` phrase may carry its own case inline: `{den Bäumen|D|unter + location takes Dativ. In the plural Dativ, den + noun + -n.}`
- The English translation reads like natural English and covers the whole sentence.
- Examples (copy this quality):
  - `Ich fahre mit [dem Zug] nach Berlin, aber die {Züge} nach München sind schneller.` · D · "mit always takes Dativ."
  - `Ich helfe [meinem Nachbarn] oft, und auch die anderen {Nachbarn} im Haus sind sehr freundlich.` · D · "helfen always takes Dativ. Nachbar is an n-noun: meinem Nachbarn."

### 1.5 Stories → `src/data/stories.json`
Write 3–5 micro-stories per lesson chunk (5–6 sentences each, present tense for A0.1). Use **only nouns from
that lesson and earlier lessons**, plus very common function words and verbs. Mark every noun phrase as
`[phrase|CASE|why]` or `{plural phrase}` so the app can work out which nouns a story needs and show the
case lens. Each sentence has its own English translation.
```ts
type Story = { id: string; title: string; lesson: string; sentences: { de: string; en: string }[] };
```

### 1.6 Validation → `npm run validate` must pass
It fails on any of these: article not in der/die/das; missing `[` or `{` marker; plural form not in the sentence;
an unknown icon name; duplicate ids; a sentence over 30 words; a `[…]` phrase without a case; a story noun
from a later lesson; fewer than 40% non-nominative sentences. It prints counts per book, lesson, article and
pluralType, plus the share of N/A/D.

## 2. Rule engines (`src/lib/rules.ts`): from my own notes, implement exactly

### 2.1 Article rules
Check the clues in this order: **1. biological sex → 2. meaning → 3. ending.** Show it like this in the UI.

| | By meaning | Ending: always | Ending: mostly |
|---|---|---|---|
| **der** | Male persons (Vater, Bruder, Onkel) · Male professions (Pilot, Maler, Arzt) · Times of day, days, months, seasons (Morgen, Montag, Mai, Sommer), **except die Nacht** · Car brands (der BMW, der Audi) | -ling, -ich, -ismus | -er, -ant, -ast, -ig, -or, -är, -eur, -ist, -ent |
| **die** | Female persons (Mutter, Schwester) · Female professions (Lehrerin, Ärztin) · Numbers as nouns (die Eins, die Zwei) · Names of planes, ships, motorbikes (die Boeing, die Titanic, but das Flugzeug, das Schiff) | -heit, -keit, -schaft | -e, -ei, -ung, -ion, -ik, -ur, -tät, -in (≈ 90%) |
| **das** | Neutral and young persons (das Kind, das Baby) · Adjectives and colours used as nouns (das Rot, das Unbekannte) · Verbs used as nouns (das Schreiben, das Lesen, das Laufen) · Materials (das Holz, das Glas, das Metall) | -chen, -lein | -um, -ment, -tum, -o, -ell, -eau, -ing |

`articleWhy(word)` returns `{ kind: "rule" | "exception" | "none", text, clue }`:
- If `meaningRule` is set, use it (an "Exception: …" label gives kind `exception`).
- Otherwise match the **longest** ending; only count it if the word is at least 2 letters longer than the ending
  (so `Ei` doesn't match `-ei`).
  - If the matching ending's article equals the word's article → `rule`: `Ends in -ung → die (always)`.
  - If not → `exception`: `Exception: -e is usually die` (das Auge, das Zimmer, der Termin, der Kuchen).
  - If nothing matches → `none`: `No rule fits. Learn it with its colour.`
- `clue` is the hint without the answer: `Ending clue: it ends in -ung.` or `Meaning clue: male professions.`

### 2.2 Plural rules
Compute `pluralType` from the singular and plural forms (ignore umlauts to find the added ending; `-se` counts as `e`, `-en` as `n`).
The five patterns from my notes, with their explanation text:
1. **Feminine → add -n / -en** (about 9 in 10; also most nouns ending in -e): Lampe → Lampen, Uhr → Uhren
2. **Masculine → add -e, often with an umlaut** (short neuter nouns too): Hund → Hunde, Zug → Züge
3. **Neuter → add -er, umlaut when possible**: Ei → Eier, Bild → Bilder, Haus → Häuser
4. **Ends in -er, -el, -en, -chen, -lein → no change** (masculine and neuter; some only add an umlaut): Messer, Erdbeben, Apfel → Äpfel
5. **Foreign words, abbreviations, vowel endings (-a, -i, -o, -u, -y) → add -s**: Autos, Handys, Kameras

`pluralWhy(word)` adds the gender exceptions: feminine `¨e` (Hand, Nacht, Stadt), masculine n-nouns
(Nachbar, Junge, Student), neuter `-(e)n` (Auge, Bett, Hemd).

### 2.3 Case forms (for the lens)
Determiner forms by gender for Nom / Akk / Dat:
- definite: m der/den/dem · f die/die/der · n das/das/dem · pl die/die/den (+ -n on the noun)
- `ein`, `kein` and the possessives (`mein, dein, sein, ihr, unser, euer`): m X/Xen/Xem · f Xe/Xe/Xer · n X/X/Xem · pl Xe/Xe/Xen
- `dies-`: dieser/diesen/diesem · diese/diese/dieser · dieses/dieses/diesem · diese/diese/diesen

## 3. Screens: match the prototype

**Stack:** Vite + React + TypeScript. Hand-written CSS with CSS variables (no Tailwind defaults, no shadcn, no
component kit). `lucide-react` icons at stroke width 1.5. Geist + Geist Mono (`@fontsource`). Zustand for
state. Dexie (IndexedDB) for progress, with JSON export and import. `vite-plugin-pwa` for offline use.
**Audio:** Web Speech API (`de-DE`; prefer a Google, Natural or Enhanced voice) behind an `AudioProvider`
interface, so MP3s can replace it later. Speeds are normal (0.95) and Slow (0.68).

### Shell
- **Desktop rail** (floating, rounded 30px, collapsed to icons at 76px, expands to 236px with labels). Items in
  groups split by hairline dividers: *Cards* (badge = cards due) · *Lessons* | *Article practice* · *Plural
  trainer* · *Daily story* | *Word bank* · *Rules* · *English bridges* | an Expand/Collapse button at the bottom.
  Active item: a pill with a violet radial glow on the left, a 1px light border, and a 3px glowing bar outside
  the rail's left edge.
- **Top bar:** mono eyebrow (`A0.1 · L2 Essen und Trinken · 8 nouns`) + view title. On the right: a
  **DE→EN / EN→DE** segmented control (Cards only), a **lesson picker** (`All lessons` + an optgroup per book;
  shown on Cards, Article practice, Plural trainer and Word bank), a **Slow** audio pill, and a **today** counter.
- **Phone (< 760px):** the rail becomes a floating bottom tab bar with safe-area insets. No horizontal scroll at 360px.

### 3.1 Cards: Deutsch → English
- Card with a raised **icon tile** overlapping its top-left corner (92px, radius 22px, cream line icon with a soft glow).
- Top right: 5 memory-box dots + a chip `Verkehr · A1.1 L1`.
- The word in large type (40–62px), with the article coloured by gender. Clicking it plays `der Zug`.
- Meta rows (mono uppercase labels):
  - **Plural:** `die Züge` plus a small `¨-e` label and a play button. **Blurred until you hover the word**
    (or focus it, or tap it on touch).
  - **Why der:** `articleWhy().text`; exceptions in amber, "no rule" muted.
  - **Bridge:** `≈ tug · t → z`, or "No English twin. Let the sentence carry it."
- A hatched progress track (diagonal stripes, violet fill) + `12 / 60`.
- The sentence: the singular phrase underlined in its gender colour, the plural with a dotted violet underline,
  and a play button. **The case lens is on the determiner** (3.6). Under it: "Hover the highlighted article to see why it changed."
- `IN ENGLISH`: the translation, blurred until revealed.
- A false-friend strip in amber when relevant.
- Actions: **Reveal the English** (Space), then **Again** (1) / **Got it** (2). Keys: L word, P plural, S sentence.

### 3.2 Cards: English → Deutsch
Shows the icon, "Say it in German", the English sentence, the progress track and a textarea. **Hint** shows
`der Zug · die Züge`. **Check** (Enter): word-level LCS diff, tolerant of `ae/oe/ue/ss` and punctuation. Matched
words in cream, missed words in rose with a wavy underline, an `x/y` score, the marked-up target sentence
(with the lens), then the audio plays. Name article and plural mistakes explicitly ("article: dem, not den").

### 3.3 Spaced repetition
5 Leitner boxes with intervals of 0, 1, 3, 7 and 21 days. Again → box 1, and the card comes back 4 cards later.
Queue: due cards first, then new cards **in book order** (`order`), with a daily cap on new cards (default 15).
"Known" means box ≥ 2.

### 3.4 Lessons
"Same order as your books." An **All lessons** row, then one section per book (`BOOK A0.1`, `BOOK A1.1`). Each
lesson row has: a number tile, the title, `9 words · 3 known`, a thin hatched progress bar, a strip of the
lesson's icons, a **Next up** tag on the first unfinished lesson, and "Study →". Clicking a row scopes the app
to that lesson and opens Cards.

### 3.5 Article practice (NO timer)
An untimed, gentle drill. The icon tile, `right / total` and the streak, the noun without its article in large
type, and buttons for **der / die / das** (keys 1/2/3). **Show a clue** (H) shows `articleWhy().clue` without
giving the answer away. After an answer, the card glows green or shakes once. The correct article appears in
front of the noun, then the rule text, the plural with a play button, and the correct button highlighted while
the others fade. **Next noun** (Enter). Scoped to the selected lesson.

### 3.6 Case lens (hover an article)
Every determiner inside a `[…]` or a case-annotated `{…}` phrase is a small pill. Hover, focus or tap it to
open a floating card (fixed position, kept inside the viewport):
- the header: `der → dem` (or `die · no change`) + the case name (`DATIV`) in violet
- the `why` text
- a 3-cell **Nom / Akk / Dat** table for that determiner and gender, with the current case highlighted
- the footer: `der Zug is masculine` (or `Plural · die Bäume`)

It works the same in card sentences, English → Deutsch results and stories.

### 3.7 Plural trainer
`der Zug` in large type and `die Zug + ?`. Eight ending buttons in a 4×2 grid (2×4 on a phone), keys 1–8:
`–` no change · `¨` umlaut only · `-e` · `¨-e` · `-er` · `¨-er` · `-(e)n` · `-s`. After an answer: the real plural with
audio, `pluralWhy()`, and the correct button glowing. A row of chips shows how often each pattern appears
in the current lesson (`-(e)n 21 · -e 14 …`). Untimed. **Next noun** (Enter).

### 3.8 Daily story
- **Today's story** = a story whose nouns are **all known**. Pick one by date, from the current lesson or
  earlier. If none qualifies, show the story with the highest coverage.
- The header: a status chip (`ONLY WORDS YOU KNOW` in green, or `3 NEW WORDS` with a lock icon), the lesson
  label, the title, and a `k/n words known` bar.
- If a story has unknown nouns, list them in a clue box with a **Study the 3 new words** button. It puts those
  words at the front of the Cards queue.
- **Play story**, and an **English hidden / shown** toggle. Each sentence row has the German (nouns highlighted,
  unknown ones marked with a small violet `NEW`, articles with the lens), a play button and its English line
  (blurred; tap to show).
- Below: a list of all stories with coverage bars. "today" marks today's story.

### 3.9 Word bank
5-box distribution bars at the top, umlaut-tolerant search (German or English), and a der/die/das filter.
Tile grid: icon, `A0.1·L1`, the coloured article and word; on hover the topic line slides up and
`die Plural` slides in. Clicking a tile plays the word and opens it as the next card.

### 3.10 Rules
"Finding the article" with the three clue chips `1 Biological sex → 2 Meaning → 3 Ending`. Three columns
(der / die / das): *By meaning* (label + examples), *By ending* (suffix chips with an `ALWAYS` / `MOSTLY` / `≈ 90%`
badge), *From your deck* (words that follow the rule; tap to hear them), and *Look like X, aren't* (the
exceptions, in amber). Then a **Plurals** card with the 5 patterns, examples from the deck filtered by gender,
and buttons to both trainers.

### 3.11 English bridges
The method page. A short intro, 9 sound-shift cards (t → z/ss, p → f/pf, d → t, th → d, k → ch, -ght → -cht, v/f → b,
y → g, sh → sch) with 6 pairs each (tap to hear), plus a **False friends** card (Gift, Handy, bekommen, Rat, also,
Chef, fast, Kind). Link each rule to the deck words that follow it.

### 3.12 Settings (new; not in the prototype)
Voice picker, slow audio, daily new-card limit, reset progress, export and import progress.

## 4. Design system: follow it strictly

```
--ink #09080b (page; one soft white spotlight top-right)   --slab #141317   --slab-2 #1b1a1f
--line rgba(255,255,255,.07)   --line-2 rgba(255,255,255,.12)
--paper #ece6dc (warm cream text, never pure white)   --mute #8d8894   --dim #5c5862
--violet #b25cff  ← the ONLY accent: active nav, primary buttons, progress, plural underline, lens
--der #8fb1ff   --die #ff8faa   --das #88dcb4  ← used only for articles and gender
--ok #88dcb4   --bad #ff8faa   --warn #f2c57c (exceptions and false friends)
radius: card 26 · tile 22 · button 16 · chip 10 · pill 999
type: Geist 400/500; the word 40–62px at -0.035em; labels in Geist Mono 10.5px uppercase, +0.12em
card: 160° gradient #1c1b20 → #111013, inset 0 1px 0 rgba(255,255,255,.06), deep soft drop shadow
```

**It must not look AI-generated:** no purple-to-blue gradients, no blur on every surface, no emoji, no sparkle
icons, no "AI-powered" copy. Violet appears in only a few places. Only objects you can act on get borders and
shadows. Motion lasts 200–350ms and is ease-out: one shake, one glow. Respect `prefers-reduced-motion`. Copy is
short and plain, and buttons say what they do ("Reveal the English", "Next noun"). Every control has a
visible focus ring, and every shortcut works.

## 5. Phase 2 (after the MVP passes)
Shadowing (record yourself and compare with the audio) · Cognate guesser (apply a sound shift to guess the
German) · Genitive in the lens for A2 · An A2 path map (A0.1 → A1.1 → A1.2 → A2), unlocked by words in box 4 or higher.

## 6. Acceptance criteria
- `npm run validate` passes. Every noun from both books is present, chunked by lesson in first-appearance order,
  with its source page.
- Every card has: an icon, the correct article, `articleWhy`, the plural, a `pluralType`, a sentence with both forms,
  a case annotation and a natural English translation.
- The plural reveals on hover, focus and tap. The case lens works on card sentences, EN→DE results and stories.
- Article practice and the plural trainer have no timer and explain every answer.
- A daily story only uses known nouns, or it names the missing ones and queues them.
- Audio plays for the word, plural, sentence and story, at normal and slow speed.
- Progress survives a reload and the app works offline. Lighthouse accessibility ≥ 95. Phone layout checked at 360px and 400px.

## 7. Order of work
1. List the folder → show me the lesson lists of both books → **wait for my OK**.
2. Extract → show me the first 20 nouns of A0.1 L1, with their pages → wait for my OK.
3. Full pipeline → `words.json`, `stories.json` → the validation report.
4. Shell and tokens → Cards (both modes) + case lens → SRS → Lessons → Article practice → Plural trainer →
   Daily story → Word bank → Rules → Bridges → Settings.
5. PWA and offline support, then the accessibility pass. Commit after each step. At the end, summarise word
   counts per book and lesson, and the N/A/D share.
