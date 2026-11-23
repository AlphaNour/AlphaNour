# NOUR — Brand & Design System
Version 1.0 · Dark-only · Android

---

## 1. The Name

**NOUR** — Arabic: light.

A black app named light. The whole brand sits in that tension: you open darkness and
find one illuminated line. It is personal (your name), short, pronounceable in every
language, and it means something. It needs no explanation and it never dates.

Wordmark: `N O U R` — Inter Medium, uppercase, letter-spacing +0.18em, optical kerning.
Never bold. Never italic. Never coloured. Warm white on black, or black on warm white.

Tagline: **One line a day.**
Store subtitle: *One line a day. Nothing else.*

Fallbacks if the Play listing name is taken: `Nour — One Line a Day`, `Nour Daily`.
Do not append numbers, do not append "App", do not use a hyphenated compound.

---

## 2. Positioning

| | |
|---|---|
| Category | Daily affirmation — one screen, one sentence |
| Promise | Ten seconds that change the posture of your day |
| Anti-promise | No feed, no library, no coach, no streak anxiety, no account |
| Felt quality | A hand-set page, not a dashboard |
| Competitive wedge | Everyone else gives you *more*. Nour gives you *one*. |

**The restraint is the product.** Every feature request gets measured against: does this
make the single line land harder? If not, it is cut. An affirmations app with a browse
tab is a content app. Nour is an appointment.

---

## 3. Principles

1. **One thing per screen.** If a screen has two purposes, it is two screens.
2. **Black is the ground, not a theme.** True `#000000` so the pixels are genuinely off
   on OLED and the text appears to float with no visible container.
3. **Light is earned.** Brightness is reserved for the affirmation. Chrome recedes.
4. **Motion reveals, never decorates.** Every animation answers "what just arrived?"
5. **Silence is premium.** No sound. One haptic per session. No badges.
6. **Type does the work.** There is no illustration, no photography, no gradient mesh.
   The interface is a typeface and the dark.
7. **The exit is part of the design.** The app is finished with you in ten seconds and
   says so. Closing it should feel like completion, not abandonment.

---

## 4. Colour

Warm-neutral axis throughout. A blue-black reads clinical; a warm black reads like ink
on paper at night.

### Ground and surfaces
| Token | Hex | Use |
|---|---|---|
| `ground` | `#000000` | App background. Always. |
| `surface1` | `#0B0B0C` | Sheets, cards, archive rows |
| `surface2` | `#131315` | Pressed states, raised rows |
| `surface3` | `#1B1B1E` | Inputs, pills, toggle tracks |

### Lines
| Token | Value | Use |
|---|---|---|
| `hairline` | `#FFFFFF` @ 8% | Dividers, card edges |
| `hairlineStrong` | `#FFFFFF` @ 14% | Focus rings, active edges |

Hairlines are drawn at exactly 1 physical pixel (`1.dp / density`), not 1dp.

### Ink
| Token | Hex | Contrast on ground | Use |
|---|---|---|---|
| `inkPrimary` | `#F7F5F1` | 19.1:1 | Affirmation, titles |
| `inkSecondary` | `#A3A09B` | 8.1:1 | Body, settings labels |
| `inkTertiary` | `#6B6862` | 3.7:1 | Eyebrows, metadata — **large/bold only** |

Never `#FFFFFF`. Pure white on pure black vibrates at the edges and reads cheap.
`#F7F5F1` is a half-degree warm and sits still.

### Accent — a single hue, rationed
| Token | Hex | Use |
|---|---|---|
| `accent` | `#C8A96A` | The light. One element per screen, maximum. |
| `accentDim` | `#8A7447` | Disabled accent, dividers under accent |

Accent appears in: the icon arc, the active state of one control, the streak marker,
the share-card rule. **It must never exceed roughly 3% of the pixels on screen.** If you
can see two gold things at once, remove one.

There is no second accent. No red for errors — errors use `inkPrimary` text and a
hairlineStrong border. No green for success — success is a haptic and a state change.

---

## 5. Typography

Two families. Four weights total. No exceptions.

### Display — the affirmation
**Instrument Serif** (SIL Open Font License, Google Fonts). Regular and Italic only.
High-contrast, editorial, slightly literary. It gives the sentence authority without
costume. Bundle the static TTFs in `res/font` — never fetch at runtime.

Approved alternatives if a different voice is wanted: **Newsreader** (softer),
**Fraunces** (more opinionated), **EB Garamond** (more classical). Pick one and delete
the others. Do not ship two serifs.

### Interface
**Inter** (variable, OFL) at 400 / 500 / 600. Tabular numerals enabled for dates and
day counts.

### Never
Roboto, system default, Montserrat, Poppins, any geometric display sans, any rounded
sans, any typeface with more than one width axis in use.

### Scale

| Role | Size | Line height | Tracking | Family / weight |
|---|---|---|---|---|
| `affirmationXL` | 40sp | 46sp | −0.5sp | Instrument Serif Regular |
| `affirmationL` | 34sp | 40sp | −0.4sp | Instrument Serif Regular |
| `affirmationM` | 28sp | 34sp | −0.3sp | Instrument Serif Regular |
| `title` | 20sp | 26sp | −0.2sp | Inter 600 |
| `body` | 16sp | 24sp | 0 | Inter 400 |
| `label` | 13sp | 18sp | +0.2sp | Inter 500 |
| `eyebrow` | 11sp | 14sp | +1.2sp | Inter 500, uppercase |
| `caption` | 12sp | 16sp | +0.1sp | Inter 400 |

**Optical sizing rule (implement this, do not skip it):** the affirmation tier is chosen
by character count, not by hand.
- ≤ 70 chars → `affirmationXL`
- 71–120 chars → `affirmationL`
- \> 120 chars → `affirmationM`

Then, if the laid-out text still exceeds 5 lines at the chosen tier, step down one tier.
A sentence must never scroll and must never be truncated.

### Setting the affirmation
- Left-aligned. Ragged right. Never centred, never justified.
- Optically centred in the viewport: the text block sits at roughly 46% of the height,
  not 50% — a block centred by maths reads low.
- Measure: 24dp side gutters, block max width 420dp, target 28–36 characters per line.
- No hanging punctuation, no quotation marks around the affirmation, no attribution,
  no quote glyph, no full stop unless the sentence is genuinely two clauses.
- One word may be italic for emphasis, chosen in the content file, never by code.

---

## 6. Space & Form

Base unit 4. Allowed steps: `4 8 12 16 24 32 48 64 96`. Nothing else.
Side gutter: 24. Section gap: 32. Hero breathing room: 64 minimum above and below.

**Radii:** `0` full-bleed · `12` buttons and pills under 48dp tall · `16` sheets and cards
· `999` circular targets. One radius per component — never mix two radii in one object.

**Elevation:** there are no shadows. On black, a shadow is invisible or dirty. Depth is
expressed only by (a) stepping up the surface token and (b) a hairline edge. This single
rule is most of what makes the app look expensive.

**Icons:** 24dp box, 1.5dp stroke, round caps and joins, no fills, no two-tone. Inherit
`inkSecondary`; `inkPrimary` only when active.

**Touch targets:** 48dp minimum, always, even when the glyph inside is 20dp.

---

## 7. Motion

Two curves. Five durations. Nothing bounces.

```
curveEnter = cubic-bezier(0.20, 0.00, 0.00, 1.00)   // emphasised decelerate
curveExit  = cubic-bezier(0.40, 0.00, 1.00, 1.00)   // accelerate away

tap        120ms
micro      200ms
transition 320ms
reveal     560ms
hero       880ms
```

### The Reveal — the signature moment
Plays when the app is opened from a notification, or on the first open of a calendar day.
Nothing else in the app animates this hard.

| Step | Element | Motion | Duration | Delay |
|---|---|---|---|---|
| 1 | Ground | already black — no fade | — | 0 |
| 2 | Eyebrow (date) | opacity 0→1, translateY +8dp→0 | 320 | 80 |
| 3 | Affirmation, **per line** | opacity 0→1, translateY +14dp→0, scale 0.985→1 | 560 | 200 + 70×lineIndex |
| 4 | Footer (day n · next 07:30) | opacity 0→1 | 320 | 200 + 70×lines + 120 |

Per-line staggering requires real line geometry: measure the string with
`rememberTextMeasurer`, read `TextLayoutResult.lineCount` and `getLineStart/getLineEnd`,
then render each line as its own `Text` in a `Column` with per-line animation. Do not
fake it by splitting on words — that destroys the rag.

One haptic — `VibrationEffect.EFFECT_TICK` — fires at the instant line 1 lands. It is the
only haptic in the app.

**Reduce motion:** if `Settings.Global.ANIMATOR_DURATION_SCALE == 0f` or the OS reports
reduced motion, skip steps 2–4 entirely and render at final state. Keep the haptic.

### Everywhere else
Cross-screen: 320ms, opacity + 12dp translate on the incoming layer only. No shared-element
transitions, no scale-from-origin, no circular reveals. Press feedback: 120ms to
`surface2`, no ripple splash — use a flat state change with `indication = null` and an
explicit pressed background.

---

## 8. Voice

**The affirmations are first person.** "I move first, then I feel ready." That is how
self-talk works; second person turns a mantra into an instruction from a stranger.

**The interface is second person.** "Your line arrives at 07:30."

### Rules
- 4–14 words per affirmation. If it needs 20, it is two affirmations or a journal entry.
- Present tense. Concrete over abstract. A verb beats an adjective.
- No exclamation marks. Anywhere in the product, ever.
- No emoji. Not in the UI, not in notifications, not in the store listing, not in the icon.
- No ALL CAPS except the 11sp eyebrow.
- No "just", no "simply", no "unlock", no "journey", no "manifest", no "vibes".
- Sentence case for everything, including buttons. `Continue`, not `CONTINUE`.
- Buttons are verbs: `Continue`, `Choose time`, `Turn on reminders`, `Done`.

### Register check
> Wrong: "Ready to unlock your best self? Let's go!"
> Right: "One line, every morning. That is the whole app."

---

## 9. Icon & Marks

**App icon:** black field, edge to edge. A single thin arc in `accent` rising from the
lower edge — a sliver of light, a crescent, a sunrise clipped by the frame. Stroke
weight scaled to 4% of the icon width. No letterform, no gradient, no bevel, no shadow.
It must read at 48px.

Adaptive icon: background `#000000` solid, foreground the arc at 66% safe zone.
Monochrome layer required for Android 13+ themed icons.

**Notification small icon:** the same arc, pure white, flattened to a 24dp monochrome
silhouette with transparent background and no built-in padding beyond 2dp.

**Share card:** 1080×1920 and 1080×1080. Black. Affirmation set in Instrument Serif,
optically centred, 72dp side margins. A 1px `accent` rule 32px wide above the wordmark.
Wordmark `N O U R` at the bottom in `inkTertiary`. No URL, no store badge, no QR code.

---

## 10. The Never List

Print this. It is the difference between sleek and almost-sleek.

- No drop shadows, no glows, no neumorphism, no glass blur as decoration
- No gradients, except a single black scrim if imagery is ever introduced
- No pure white, no 50% grey, no colour outside the eleven tokens above
- No second accent hue; no semantic colour system
- No emoji, no exclamation marks, no ALL CAPS body copy
- No confetti, no flames, no progress rings, no badges, no levels, no points
- No bottom navigation bar in v1
- No splash screen with a logo animation — the splash is black and lasts one frame
- No onboarding carousel longer than three screens
- No "rate us" prompt, no interstitials, no upsell in the reading flow
- No account, no login, no email capture, no cloud, no analytics SDK
- No stock photography, no 3D render, no illustration, no mascot
- No more than two typefaces or four weights
- No feature that adds a tap between the notification and the sentence
