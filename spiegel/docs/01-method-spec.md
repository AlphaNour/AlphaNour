# Structure 1 — Method Spec: Self-Narrative Fading

> Your textbook is your own life, and it slowly turns German.

This document is the rulebook. Every later structure (data model, AI engine,
memory engine, app screens) implements what is written here. If the app and
this spec disagree, the spec wins until we change it on purpose.

---

## 1. Learner profile (v1)

| Setting | Value |
|---|---|
| Helper language | English (stories are told in English, explanations are in English) |
| Starting level | Absolute beginner (A0) |
| Platform | Phone app (iOS + Android) |
| Daily time | ~5 minutes, one story per day |

---

## 2. The core idea

1. You tell a short, true story from your day **in English**.
2. The app gives it back to you with **German woven into it**, only as much as
   you can handle right now plus a little more (i+1).
3. Over the following days the German parts **fade** into gaps that you fill
   from memory — your own memory of your own day.
4. As your level rises, the amount of German in each story rises, until the
   whole story is German and you tell it yourself.

Why it works:

- **Self-reference effect**: information tied to yourself is remembered far
  better than neutral information.
- **i+1 input**: each story contains only a few new items; everything else is
  known or English.
- **Diglot weave**: German islands inside a familiar English sea, so a beginner
  understands 100% of the story from day one.
- **Retrieval practice with fading**: recognise → recall → produce.
- **Spaced repetition on your own chunks**: you review phrases from your life,
  not a generic word list.

---

## 3. The Stufen ladder (German density)

A **Stufe** (step) controls how much German a story contains and which grammar
is allowed. The learner starts at Stufe 1. Grammar that is not yet unlocked is
never produced by the AI engine.

| Stufe | CEFR | German in the story | Grammar unlocked | New items per story |
|---|---|---|---|---|
| 1 | A0 | 3–5 German **nouns** woven into English | Gender (der/die/das) | max 3 |
| 2 | A0+ | Nouns + fixed **chunks** (*Guten Morgen*, *Ich bin müde*) | Chunks as whole units | max 4 |
| 3 | A1.1 | 1–2 full **German sentences** per story | Present tense, *ich/du/er/sie*, *sein/haben* | max 4 |
| 4 | A1.2 | ~50% German | Akkusativ (🎯), *kein/nicht*, word order V2 | max 5 |
| 5 | A2.1 | Mostly German, English only for unknown words | Perfekt + Satzklammer, separable verbs | max 5 |
| 6 | A2.2 | Fully German | Dativ (🎁), modal verbs | max 6 |
| 7 | B1.1 | Fully German, longer stories | Subordinate clauses (*weil, dass, wenn*), verb-final | max 6 |
| 8 | B1.2 | Fully German, learner retells without help | Präteritum, Genitiv (🔑), relative clauses | max 7 |

Rules:

- **"New item"** = a lemma or chunk that is not yet in the learner's word bank.
  Everything else in the German part must be already known.
- Before Akkusativ is unlocked, nouns appear **without case changes** (bare noun
  or nominative form only), so the learner is never shown a form they cannot
  explain yet.
- At Stufe 3–4 past events are told in the **present tense** (a deliberate
  simplification). Real past tense unlocks at Stufe 5.
- New items are chosen by: (1) personal salience — words from the learner's
  own story first, (2) frequency — common words beat rare ones, (3) reuse —
  a word seen in earlier stories is preferred over a brand-new one.

---

## 4. The visual grammar system

Two separate visual channels, so they never clash:

### Gender → color (from Stufe 1)

| Gender | Color | Example |
|---|---|---|
| der (masculine) | 🔵 blue | der Kaffee |
| die (feminine) | 🔴 red | die Arbeit |
| das (neuter) | 🟢 green | das Brot |
| plural | ⚪ gray | die Lieferanten |

A German noun is always shown **with its article** the first times it appears,
and always carries its gender color.

### Case → stage role icon (unlocked with the Stufe)

Every sentence is a little stage play. Each noun phrase plays a role:

| Case | Role | Icon | Question it answers | Unlocks |
|---|---|---|---|---|
| Nominativ | the **actor** | 🎭 | Who does it? | Stufe 3 |
| Akkusativ | the **target** | 🎯 | What/whom is hit by the action? | Stufe 4 |
| Dativ | the **receiver** | 🎁 | To/for whom? | Stufe 6 |
| Genitiv | the **owner** | 🔑 | Whose? | Stufe 8 |

### Verb bracket (Satzklammer) — from Stufe 5

The two parts of a split verb are joined by an arc drawn over the sentence:

```
 Ich habe Kaffee getrunken.
     ╰──────────────╯
```

---

## 5. The daily loop

| Step | Name | What happens | Time |
|---|---|---|---|
| 1 | 🎙️ **Erzähl** (Tell) | Learner speaks or types 30–60 s in English. If they are stuck, the app offers a prompt ("What did you eat today?", "Who did you talk to?"). | 1 min |
| 2 | 🪞 **Spiegel** (Mirror) | The woven story appears. Tap any German word → hear it, see English meaning, gender, role. Play the whole story as audio. | 1–2 min |
| 3 | 🌫️ **Verblassen** (Fade) | Reviews of earlier stories whose fade is due (see §6). | 1–2 min |
| 4 | 🗣️ **Zurücksprechen** (Speak back) | Learner says the German parts of today's story aloud; the app compares to the target. | 1 min |
| 5 | 📖 **Buch** (Book) | Today's story is saved into the learner's book. | — |

---

## 6. Fade schedule

Each story moves through fade levels. Timings are the default; the memory
engine (Structure 4) may move them per item based on performance.

| Fade | When | Task | Hint level |
|---|---|---|---|
| F0 — Mirror | Day 0 | Read + listen. Nothing hidden. | full |
| F1 — Recognise | Day 1 | Each German island is a gap; choose the right one from 3 chips. | choice |
| F2 — Recall | Day 3 | Type or say the German word; first letter + gender color shown. | first letter |
| F3 — Produce | Day 7 | Only the English story is shown; say the German parts. | none |
| F4 — Retell | Day 14+ | Retell the story at the learner's **current** Stufe (it may now contain more German than the original). | none |

A story re-woven at F4 is the moment the learner feels progress: the same
memory, now in more German.

---

## 7. Scoring and level-up

Each item (lemma or chunk) has a **mastery score** 0–5:

| Score | Meaning |
|---|---|
| 0 | Seen once |
| 1 | Recognised (F1 correct) |
| 2 | Recalled with hint (F2 correct) |
| 3 | Produced without hint (F3 correct) |
| 4 | Produced correctly in 2+ different stories |
| 5 | Used spontaneously in a retelling or a new Tell |

**Level-up from Stufe N to N+1** when all of these hold:

1. At least **80%** of the items introduced at Stufe N have mastery ≥ 3.
2. The grammar unlocked at Stufe N was used correctly in **≥ 8 of the last 10**
   F3/F4 attempts that needed it.
3. Minimum time at the Stufe: **7 days** (prevents rushing).

Word-bank targets (rough guide): Stufe 2 ≈ 60 items, Stufe 4 ≈ 250,
Stufe 6 ≈ 600, Stufe 8 ≈ 1,200.

Level-down never happens automatically; the app may suggest repeating a Stufe.

---

## 8. Feedback rules

- Correct gently: show the right form next to the learner's form, never a red ✗.
- At Stufe 1–4: **max one correction per sentence**, chosen by importance
  (meaning error > gender > case > spelling).
- Every explanation is **in English and one sentence long**, e.g.
  "*Kaffee* is masculine, so it's **der** Kaffee 🔵."
- Pronunciation feedback only on the word, never a score for the whole story.

---

## 9. Worked example — one story across Stufen

**Told in English (Day 0):**
"This morning I woke up late. I drank coffee and ate bread. The supplier
called me. I was tired."

**Stufe 1** (nouns woven in):
> This morning I woke up late. I drank 🔵**Kaffee** and ate 🟢**Brot**.
> The 🔵**Lieferant** called me. I was tired.

**Stufe 3** (simple present sentences):
> This morning I woke up late. **Ich trinke 🔵Kaffee.** I ate 🟢**Brot**.
> The 🔵**Lieferant** called me. **Ich bin müde.**

**Stufe 5** (Perfekt + bracket, roles visible):
> Heute Morgen **bin** ich spät **aufgewacht**.
> Ich **habe** 🎯Kaffee **getrunken** und 🎯Brot **gegessen**.
> 🎭**Der Lieferant** **hat** 🎯mich **angerufen**.
> Ich war müde.

**Stufe 6** (Dativ):
> Ich **habe** 🎁**dem Lieferanten** 🎯**eine E-Mail** **geschrieben**.

**Stufe 7** (subordinate clause, verb-final):
> Ich war müde, **weil** ich spät aufgewacht **bin**.

---

## 10. Decisions locked for v1

- **Phone app built with Expo (React Native + TypeScript)**: one codebase for
  iOS and Android, testable on a real phone immediately via Expo Go.
- **The AI key never lives on the phone.** A small backend (Structure 3) talks
  to the Claude API; the app talks to the backend.
- Helper language is English only in v1; the spec keeps it as a setting so
  French/Arabic can be added later.

## 11. Open questions (to revisit)

- Voice: device speech-to-text vs. a server STT service for better German
  pronunciation scoring (decide in Structure 5).
- Offline mode: can Fade reviews run without internet? (likely yes, decide in
  Structure 4).
