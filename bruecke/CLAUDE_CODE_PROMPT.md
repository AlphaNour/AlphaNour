# Prompt for Claude Code: build "Brücke"

Paste everything below the line into Claude Code, run from the folder that holds the two German books.
Change the two book filenames in **Inputs** if they differ.

---

## Role and goal

You are building **Brücke**, a web app that takes an English speaker from zero German to A2.
The idea: the learner already knows English, so we use English as the bridge. Cognates, sound-shift
rules (water → Wasser, ship → Schiff, night → Nacht) and full English sentence translations do the
heavy lifting instead of grammar tables and single-word glossaries.

The visual reference is `bruecke/prototype.html` in this repo. Open it first. Match its look, layout,
interactions and keyboard shortcuts, then go beyond it. Do not copy its inline data. The real data comes from the pipeline below.

## Inputs

1. Two German coursebooks in this folder: `<BOOK_1>.pdf` and `<BOOK_2>.pdf`. Before writing any code, list
   the folder and confirm the exact filenames and file types (PDF, EPUB, scans).
2. Your own knowledge of the official A1 and A2 vocabulary scope (Goethe-Institut / telc level lists).

## Step 1: vocabulary pipeline (do this before the UI)

Write it as scripts in `scripts/`, in Python or Node. They must be re-runnable.

1. **Extract** the text from both books (`pdftotext -layout`, `pdfplumber`, or OCR with `tesseract -l deu`
   if pages are scanned). Keep the book name and lesson/chapter number for every page.
2. **Find nouns with articles.** Match `der|die|das` + a capitalised word, plus the vocabulary-list format
   coursebooks use (`Haus, das, -¨er` and `das Haus, Häuser`). Record every noun with its source
   (`book`, `lesson`, `page`).
3. **Deduplicate and normalise.** Use the nominative singular, the correct article and the nominative
   plural. Mark nouns with no plural (`pluralOnly`, `singularOnly`).
4. **Add more A1 and A2 nouns** that the books don't cover, until the deck covers the core A1–A2 scope
   (target: 1,000 to 1,400 nouns). Tag them `source: "core"`.
5. **Enrich every entry** to this schema and save it as `src/data/words.json`:

```ts
type Word = {
  id: string;                 // "das-haus"
  article: "der" | "die" | "das";
  word: string;               // "Haus"
  plural: string | null;      // "Häuser" (without article)
  pluralRule: "-e" | "-¨e" | "-er" | "-¨er" | "-n" | "-en" | "-s" | "-" | "-¨" | "other";
  level: "A1" | "A2";
  category: string;           // German topic: "Wohnen", "Essen", "Verkehr" …
  icon: string;               // a Lucide icon name that exists in the installed version
  bridge?: { en: string; rule?: string };   // { en: "house", rule: "ou → au" }
  falseFriend?: string;       // "Not ‘handy’. Das Handy is your mobile phone."
  sentence: string;           // German, 15–25 words, with [singular] and {plural} marked
  translation: string;        // natural English translation of the whole sentence
  source: { book: "book1" | "book2" | "core"; lesson?: string; page?: number };
};
```

Sentence rules. These are what make the app work, so get them right:
- Every sentence uses **both** the singular and the plural of the noun, in natural everyday German, at
  the entry's level. Mark the singular phrase with `[…]` (include its article or determiner) and the
  plural form with `{…}`.
  Example: `[Das Haus] meiner Eltern ist klein, aber alle {Häuser} in ihrer Straße haben einen großen Garten.`
- Case changes are welcome (`den Häusern`, `einen Apfel`). They teach the case system for free.
- The English translation covers the **whole sentence**. It reads like something a native speaker would
  write, not a word-for-word gloss. The app never shows a single-word translation as the answer.
- Reuse earlier, high-frequency A1 words inside the sentences, so learners see them repeatedly.

6. **Validate** with `scripts/validate.ts` and fail loudly if any of these break: article not in
   der/die/das, missing `[` or `{` markers, plural missing from the sentence, icon name not in Lucide,
   duplicate ids, sentence over 30 words. Print counts per level, per book and per article.
7. Also generate `src/data/bridges.json` (the sound-shift rules with 6+ examples each) and
   `src/data/falseFriends.json`. Use the prototype's rules as the starting set.

## Step 2: the app

**Stack:** Vite + React + TypeScript. Hand-written CSS with CSS variables (CSS modules or one tokens
file). No component kit, no Tailwind default look, no shadcn. Icons from `lucide-react` at stroke width 1.5.
Font: Geist and Geist Mono (`@fontsource/geist-sans`, `@fontsource/geist-mono`). State in Zustand or React
context. Progress saved to IndexedDB (Dexie), with JSON export and import. Make it an installable,
offline PWA (`vite-plugin-pwa`).

**Audio:** use the Web Speech API (`de-DE`; prefer a Google, Natural or Enhanced voice when one exists)
with a normal and a slow speed. Put it behind an `AudioProvider` interface so pre-generated MP3s can
replace it later without touching the UI.

### Screens and features (MVP)

1. **Cards: Deutsch → English** (home)
   - Floating icon tile overlapping the card's top-left corner (raised, soft shadow, cream line icon).
   - Category and level chip, plus 5 memory-box dots.
   - The word in large type with its article coloured by gender: der blue `#8fb1ff`, die rose `#ff8faa`,
     das green `#88dcb4`. Clicking it plays `das Haus`.
   - **Hover (or focus, or tap on touch) reveals the plural** (`die Häuser`), which is blurred at rest, with
     its own play button.
   - "Bridge" row: `≈ house · ou → au`, or a quiet line when the word has no English twin.
   - Hatched progress track (diagonal stripes, violet fill).
   - The German sentence with the singular underlined in its gender colour and the plural with a dotted
     violet underline, plus a play button. The English sentence stays blurred until the learner reveals it.
   - False-friend warning strip in amber when relevant.
   - Actions: Reveal (Space), then Again (1) or Got it (2). Shortcuts: L word, P plural, S sentence.
2. **Cards: English → Deutsch** (toggle in the top bar, remembered)
   - Shows the icon and the English sentence. The learner types the German sentence.
   - Hint button shows `das Haus · die Häuser`.
   - Check (Enter): word-level LCS diff against the target, tolerant of `ae/oe/ue/ss` and punctuation. Show
     matched words in cream and missed words in rose with a wavy underline, an `x/y` score, then play the
     correct sentence. Flag a wrong article or a wrong plural separately ("article: der, not das").
3. **Spaced repetition:** a Leitner system with 5 boxes and intervals of 0, 1, 3, 7 and 21 days. "Again"
   returns the card to box 1 and shows it again 4 cards later. Queue order: due cards first, then new
   cards, capped at a daily new-card limit (default 15, set in Settings).
4. **Article sprint:** 45 seconds, noun and icon only, pick der/die/das with buttons or keys 1/2/3. A green
   glow for right, a shake for wrong; the result shows the correct article and the plural. The end screen
   shows the score, the best score and the missed words (tap to hear them).
5. **Word bank:** search (German or English, umlaut-tolerant), filter by level, article, book, lesson and
   category. A tile grid: icon, coloured article, word; on hover the category line slides away and the
   plural slides in. Click opens that word as the next card. A 5-box progress distribution sits on top.
6. **English bridges:** the method page. A short intro, the sound-shift rule cards (tap a pair to hear it)
   and a false-friends card. Each rule links to the deck words that follow it.
7. **Settings:** slow audio, voice picker, daily new-card limit, reset progress, export and import progress.

### Layout

- Desktop: a floating rounded rail on the left, collapsed to icons by default and expandable to labels
  (like the Iconsax "Rabbits" sidebar reference). The active item gets a violet radial glow inside a pill,
  a 1px light border and a 3px glowing indicator bar outside the rail's left edge. Groups are separated by
  hairline gradient dividers. Badge on Cards = cards due.
- Top bar: eyebrow label, view title, DE→EN / EN→DE segmented control, A1 / A2 / All filter, today count.
- Content: one centred study column, max 660px.
- Phone (under 760px): the rail turns into a floating bottom tab bar with safe-area insets, and the
  card padding shrinks. No horizontal scroll at 360px.

### Design system. Follow it strictly.

```
--ink #09080b   page ground (faint violet bias), plus one soft white spotlight at the top-right
--slab #141317 / --slab-2 #1b1a1f   raised surfaces
--line rgba(255,255,255,.07) / --line-2 .12   hairlines
--paper #ece6dc   warm cream text (never pure white)
--mute #8d8894 / --dim #5c5862
--violet #b25cff   the only accent: active nav, primary button glow, progress, plural underline
--der #8fb1ff  --die #ff8faa  --das #88dcb4   gender colours, used only for articles
--warn #f2c57c   false friends only
radius: card 26px, icon tile 22px, buttons 16px, chips 10px, pills 999px
type: Geist 400/500; the word is 40–62px, -0.035em; labels are Geist Mono 10.5px uppercase, +0.12em
```

Cards use a 160° gradient from `#1c1b20` to `#111013`, an inner top highlight
(`inset 0 1px 0 rgba(255,255,255,.06)`) and a deep, soft drop shadow, like the "Dark Mode" card reference.

**It must not look AI-generated:**
- No purple-to-blue gradients, no glassmorphism blur everywhere, no emoji, no sparkle icons, no
  "✨ AI-powered" copy.
- Violet appears in only a few places. Everything else is cream on near-black.
- Not everything is a card. Use borders and shadows only on objects you can act on.
- Motion is quiet: 200–350ms ease-out, one shake, one glow. Respect `prefers-reduced-motion`.
- The copy is short and plain. Buttons say what they do ("Reveal the English", "Got it").
- Every control has a visible focus ring, and every shortcut works.

## Step 3: phase 2 (build after the MVP passes)

- **Shadowing:** play the sentence, record the learner (MediaRecorder) and play the two back to back.
  Optionally score the attempt with the Web Speech recognition API where the browser supports it.
- **Plural pattern trainer:** group nouns by `pluralRule` and drill "which ending?".
- **Micro-stories:** each day, a 5–6 sentence story built only from words in boxes 3–5, with an English
  toggle per sentence.
- **Lesson mode:** study exactly one coursebook lesson (`book1 · Lektion 4`) before a class.
- **Cognate guesser:** show the English word, the learner applies a sound-shift rule to guess the German.
- **Case lens:** hover any article in a sentence to see why it's `den`/`dem`/`des` (case + gender).
- **A2 path:** a progress map from Null → A1.1 → A1.2 → A2.1 → A2.2, unlocked by words in box 4 or higher.

## Acceptance criteria

- `npm run validate` passes. The deck includes every noun found in both books plus the core A1–A2
  additions, and each entry shows its source.
- Every card has an icon, the correct article, the plural, a sentence that uses both forms, and a natural
  English translation of the whole sentence.
- Audio plays for the word, the plural and the sentence, at normal and slow speed.
- The plural reveals on hover, on keyboard focus and on tap.
- EN→DE mode checks typed sentences and points out article and plural mistakes.
- Progress survives a reload and works offline.
- Lighthouse accessibility ≥ 95. Phone layout checked at 360px and 400px wide.

## Order of work

1. List the folder and confirm the book files. Show me 20 extracted nouns with their sources before
   enriching the rest.
2. Pipeline → `words.json` → validation report.
3. App shell and design tokens → Cards (both modes) → SRS → Sprint → Word bank → Bridges → Settings.
4. PWA and offline support, then the accessibility pass.
5. Commit after each step with a clear message. At the end, summarise word counts per book and level.
