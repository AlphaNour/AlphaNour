# NOUR — Master Build Prompt
Paste the block below into a Claude Code terminal session. It is self-contained.

---

```
You are building NOUR, a production-grade Android affirmations app, solo, end to end.

If the files nour/BRAND.md and nour/SPEC.md exist in this repository, read BOTH in full
before writing any code — they are the authoritative design and behaviour contract and
they override anything in this prompt that is less specific. If they do not exist, this
prompt is the complete contract.

## WHAT NOUR IS

One screen. One affirmation per calendar day, identical from local midnight to local
midnight, chosen deterministically, stored offline. One notification a day, engineered so
that the user actually taps it and reads the line. Nothing else.

The restraint is the product. An affirmations app with a browse tab is a content app.
Nour is a ten-second appointment. Every feature you are tempted to add must make the
single line land harder, or it does not ship.

Name: NOUR (Arabic: light). A black app named light.
Wordmark: N O U R — Inter Medium, uppercase, letter-spacing +0.18em, never bold.
Tagline: One line a day.

## NON-NEGOTIABLE HOUSE RULES

- Dark only. Ground is true #000000 so OLED pixels are genuinely off.
- No emoji anywhere: code, UI, notifications, commit messages, store strings.
- No exclamation marks in any user-facing copy, ever.
- No drop shadows, no glows, no gradients, no glass blur, no neumorphism. Depth is
  expressed ONLY by stepping the surface token and drawing a 1-physical-pixel hairline.
  This single rule is most of what makes the app look expensive.
- Exactly two typefaces, four weights total.
- One accent hue, rationed to roughly 3% of on-screen pixels, one accented element per
  screen maximum.
- No confetti, flames, badges, rings, levels, points, or any gamification ornament.
- No account, no login, no email capture, no cloud, no analytics SDK, no INTERNET
  permission. Collecting nothing is a feature; say so in the listing.
- Sentence case everywhere, including buttons. Buttons are verbs.
- No feature that inserts a tap between the notification and the sentence.

## DESIGN TOKENS — implement these literally

Colour (warm-neutral axis; a blue-black reads clinical)
  ground          #000000    app background, always
  surface1        #0B0B0C    sheets, cards, archive rows
  surface2        #131315    pressed states
  surface3        #1B1B1E    inputs, pills, toggle tracks
  hairline        #FFFFFF @ 8%
  hairlineStrong  #FFFFFF @ 14%
  inkPrimary      #F7F5F1    affirmation, titles        (19.1:1)
  inkSecondary    #A3A09B    body, labels               (8.1:1)
  inkTertiary     #6B6862    eyebrows, metadata only    (3.7:1 — large text only)
  accent          #C8A96A    the light
  accentDim       #8A7447
Never #FFFFFF text — pure white on pure black vibrates and reads cheap.
Hairlines are drawn at exactly 1 physical pixel (1.dp / density), not 1dp.
There is no second accent and no semantic colour system. Errors are inkPrimary text with
a hairlineStrong border. Success is a haptic and a state change.

Type
  Display: Instrument Serif, Regular + Italic only, bundled as static TTFs in res/font.
  Interface: Inter variable, weights 400/500/600 only, tabular numerals for dates.
  Never Roboto, never the system default, never a geometric or rounded sans.

  affirmationXL  40sp / 46sp / -0.5sp   Instrument Serif Regular
  affirmationL   34sp / 40sp / -0.4sp   Instrument Serif Regular
  affirmationM   28sp / 34sp / -0.3sp   Instrument Serif Regular
  title          20sp / 26sp / -0.2sp   Inter 600
  body           16sp / 24sp /  0       Inter 400
  label          13sp / 18sp / +0.2sp   Inter 500
  eyebrow        11sp / 14sp / +1.2sp   Inter 500, uppercase
  caption        12sp / 16sp / +0.1sp   Inter 400

  Optical sizing rule — implement it, do not skip it: choose the affirmation tier by
  character count (<=70 -> XL, 71-120 -> L, >120 -> M), then if the laid-out text still
  exceeds 5 lines, step down one more tier. Run this AFTER the user's font scale and the
  in-app text-size setting are applied. A sentence must never scroll and never truncate.

  Setting the affirmation: left-aligned, ragged right, never centred, never justified.
  Optically centred at ~46% of viewport height, not 50%. 24dp side gutters, block max
  width 420dp, target 28-36 characters per line. No quotation marks, no attribution, no
  quote glyph. One word may render italic, chosen in the content file, never by code.

Space and form
  Base 4. Allowed steps: 4 8 12 16 24 32 48 64 96. Nothing else.
  Gutter 24, section gap 32, hero breathing room 64 minimum.
  Radii: 0 full-bleed, 12 small controls, 16 sheets and cards, 999 circular.
  One radius per component — never two radii in one object.
  Icons: 24dp box, 1.5dp stroke, round caps and joins, no fills, no two-tone.
  Touch targets 48dp minimum, always, even when the glyph is 20dp.

Motion — two curves, five durations, nothing bounces
  curveEnter = cubic-bezier(0.20, 0.00, 0.00, 1.00)
  curveExit  = cubic-bezier(0.40, 0.00, 1.00, 1.00)
  tap 120 / micro 200 / transition 320 / reveal 560 / hero 880 ms

  THE REVEAL is the signature moment. It plays when the app opens from a notification or
  on the first open of a calendar day, and nowhere else.
    eyebrow      opacity 0->1, translateY +8dp->0, 320ms, delay 80
    affirmation  PER LINE: opacity 0->1, translateY +14dp->0, scale 0.985->1,
                 560ms, delay 200 + 70*lineIndex
    footer       opacity 0->1, 320ms, delay 200 + 70*lineCount + 120
  Per-line staggering needs real line geometry: measure with rememberTextMeasurer, read
  TextLayoutResult.lineCount and getLineStart/getLineEnd, render each line as its own Text
  in a Column with per-line animation. Do NOT split on words — that destroys the rag.
  One haptic, VibrationEffect.EFFECT_TICK, at the instant line 1 lands. It is the only
  haptic in the app.
  If Settings.Global.ANIMATOR_DURATION_SCALE == 0f, skip the choreography and render at
  final state. Keep the haptic.
  Everywhere else: 320ms, opacity + 12dp translate on the incoming layer only. Press
  feedback is a flat 120ms change to surface2 with indication = null. No ripple splash,
  no shared-element transitions, no circular reveals.

Voice
  Affirmations are FIRST person ("I move first, then I feel ready") — that is how
  self-talk works. Interface copy is SECOND person ("Your line arrives at 07:30").
  4-14 words per affirmation, present tense, concrete over abstract, a verb beats an
  adjective. Banned words: just, simply, unlock, journey, manifest, vibes.
  Register check — wrong: "Ready to unlock your best self? Let's go!"
                   right: "One line, every morning. That is the whole app."

## THE DAY ENGINE

Requirement: same calendar day -> same affirmation, every launch, every timezone, offline,
no repeat until the list is exhausted, and any past date must be reconstructible.

Do NOT pick randomly and store the result. Do NOT use hash(date) % size — it collides and
repeats early.

  First launch: seed = SecureRandom.nextLong(); order = fisherYates(0..n-1, seed) persisted
  as List<Int>; cycleStartDay = LocalDate.now(zone).toEpochDay(); cycle = 0.
  For any date d: offset = d.toEpochDay() - cycleStartDay
    0 <= offset < order.size  -> list[order[offset]]
    offset >= order.size      -> roll the cycle, then resolve
    offset < 0                -> resolve from the retained previous order
  Rolling: cycleStartDay += order.size; cycle += 1; reshuffle with (seed xor cycle); if
  the new order's first element equals the old order's last element, swap it with index 1.
  Retain the last two orders so the archive stays resolvable backwards.

Day boundary is local midnight via LocalDate.now(ZoneId.systemDefault()).toEpochDay().
DayEngine is a PURE function of (date, order, cycleStart, list) and takes a Clock and a
ZoneId as parameters. No LocalDate.now() inside it — tests must be able to move time.

Content lives in app/src/main/assets/affirmations.json:
  { "version": 1, "items": [ { "id": "a001", "text": "...", "emphasis": "first",
    "tags": ["action"] } ] }
emphasis is one word rendered italic and must occur verbatim in text. Validate on load:
non-empty, unique ids, 3-180 chars, no trailing whitespace, no emoji codepoints. An
invalid item is skipped and logged, never fatal. Ship 40 placeholder lines that obey the
voice rules so the app runs immediately; the real list must drop into this file with ZERO
code changes. If items.size changes between releases, rebuild order and reset cycleStartDay
to today while retaining the previous order for the archive.

## THE NOTIFICATION ENGINE — the hardest part and most of the value

An affirmation app with a beautiful screen and a notification nobody taps is a failed app.

Core mechanic: TEASER, NOT PAYLOAD. The notification must NOT contain the affirmation. If
it does, the user reads it on the lock screen, never opens the app, and the ritual never
forms.
  Title: a rotating hook, 2-5 words, no terminal punctuation
  Body:  the first 4-6 words of today's affirmation + " …", cut at a word boundary,
         never past 32 characters
  Example — title: today's line is ready / body: I move first, then …

No BigTextStyle (expanding must reveal nothing new). No action buttons — the whole
notification is the target. No large icon, no image, no progress, no chronometer.
setAutoCancel(true), setOnlyAlertOnce(true), one reused notification id.

Hook bank of 16, selected as (dayIndex * 7) % 16 so consecutive days never feel adjacent
and nothing repeats inside 16 days:
  today's line is ready / one line, then go / something for this morning / a thought
  before the day starts / this one is yours / read this once / {n} words, that's all
  (n computed from today's word count) / your line for today / open, then close / keep
  this one close / for the next twelve hours / before anything else / short, on purpose /
  ten seconds / the quiet part of the morning / it's waiting
Separate nudge bank of four, different register:
  still unread / it's still there / whenever you're ready / no rush, it's short

Timing
  Default 07:30 local, settable to the minute. Presets in onboarding and settings:
  On waking 07:00 / With coffee 07:30 / Start of work 09:00 / Evening 21:00.
  Nudge at T+5h only if ALL of: today unread, local time <= 21:00, no nudge yesterday,
  fewer than 3 nudges in the last 7 days.
  Hard cap 9 notifications per rolling 7 days, enforced in code.
  Zero notifications once the day's line is read — cancel the pending nudge immediately.

Delivery reliability — the checklist most apps fail
  Use AlarmManager.setExactAndAllowWhileIdle, NOT WorkManager, for the moment of delivery.
  WorkManager batches and drifts 10+ minutes; a 07:30 reminder landing at 07:52 is a
  different product.
  Declare SCHEDULE_EXACT_ALARM and check canScheduleExactAlarms() on every arm. Do NOT
  declare USE_EXACT_ALARM — Play policy restricts it to alarm clocks and calendars and an
  affirmations app will be rejected for it.
  If exact is denied: fall back to setWindow with a 15-minute window plus the watchdog,
  and surface an honest Settings row that deep links to
  ACTION_REQUEST_SCHEDULE_EXACT_ALARM. Never silently degrade.
  One-shot chain, not a repeating alarm — each fire arms the next. Repeating alarms are
  inexact on modern Android and drift.
  Re-arm on BOOT_COMPLETED, MY_PACKAGE_REPLACED, TIMEZONE_CHANGED, TIME_SET, and every
  cold start.
  Watchdog: a PeriodicWorkRequest every 6 hours asserting that a next alarm exists and
  that today's notification was posted if its time has passed; re-arm or post late if
  not. This is what keeps the ritual alive on aggressive OEM ROMs.
  If the watchdog records two missed fires in 14 days, show ONE dismissible, never-repeated
  Settings row offering ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS. Never gate onboarding
  on it.
  POST_NOTIFICATIONS is requested on onboarding screen 3, after value is shown, never on
  cold launch. If denied, the app stays fully usable.

Channel: one channel, id "daily", name "Daily line", IMPORTANCE_HIGH, setSound(null) with
a short vibration pattern. High importance still gives a heads-up banner; the silence is
what makes it feel expensive rather than needy. No lights, no badge.

From tap to sentence — the click is worthless if the payoff is not instant
  PendingIntent -> MainActivity with extras source=notification and date=<epochDay>,
  launchMode singleTop, no router activity, no deep-link library.
  THE FIRST FRAME MUST ALREADY CONTAIN THE AFFIRMATION. When the alarm fires, write
  today's text into plain SharedPreferences (today_text, today_epoch_day). MainActivity
  reads that key synchronously in onCreate before setContent, so the first composition has
  real content. DataStore is coroutine-only and will cost you a blank frame.
  SplashScreen API: black, no icon animation, keepOnScreenCondition false immediately.
  Budget: cold start to visible sentence under 400ms on a mid-range device.
  The Reveal plays when source=notification or on the first open of the day; otherwise
  render at final state. The animation is the reward for the tap.

## READ REGISTRATION AND STREAK

A read registers when Today has been continuously RESUMED for 2.5 seconds with today's
affirmation displayed. There is no button. On registration: cancel the pending nudge,
increment the streak if yesterday was read else reset to 1, persist lastReadEpochDay, and
fade in the footer "Day {n} · next at {time}".

The streak is one line of caption text. Never a ring, a flame, a badge, an app-bar counter,
or a notification. Breaking it produces no message, no "you lost your streak", no recovery
offer. It silently starts at 1 again.

## SCREENS

Today — the entire app. No app bar, no title, no logo, no back affordance, no scrolling,
no pull-to-refresh. Eyebrow date (SAT 23 NOVEMBER) in inkTertiary, 24dp gap, the
affirmation, and a footer "Day 14 · next at 07:30" that fades in only after the read
registers. A 44dp ⋯ target at top-right opens a bottom sheet with three rows: Archive,
Settings, Share today. Long-press the affirmation opens the same sheet plus Favourite and
Copy.

Archive — vertical list, newest first, back to install date. Each row: 11sp date eyebrow
then the affirmation at body size clamped to 2 lines with a true ellipsis. Hairline
dividers, no cards, no chevrons. One pill at the top toggles All / Favourites. Tap a row
for a full-screen read in the Today type treatment with no reveal and a 48dp close target.

Settings — one column, hairline-separated rows, no section cards: Reminder (themed time
picker with the four presets above the wheel) · Second reminder switch, copy "If the first
one goes unread, one quiet nudge five hours later." · Exact delivery row, rendered only
when the OS has denied exact alarms, copy "Android is batching your reminder. Allow exact
timing so it lands at 07:30." · Haptics switch · Text size, three steps Standard/Large/
Larger scaling the affirmation by 1.0/1.15/1.3 before the optical sizing rule runs ·
Share Nour · Licences · Version. Nothing else — no sign-in, no theme picker, no feedback
form, no restore purchases.

Onboarding — three screens, under twenty seconds, never shown again.
  1. "One line a day. Nothing else." -> Continue
  2. "When do you want it?" four preset pills with 07:30 pre-selected, plus Choose another
     time -> Continue
  3. "Nour sends one notification a day. Nothing else." -> Turn on reminders triggers the
     system POST_NOTIFICATIONS dialog. A text-only "Not now" sits below at the same size
     with no colour.
  Then straight into Today with the full Reveal. No account, no name, no goals quiz, no
  "what brings you here" survey.

Share card — rendered off-screen at 1080x1920 and 1080x1080: black, affirmation in
Instrument Serif optically centred with 72px side margins, a 1px accent rule 32px wide
above the wordmark, N O U R at the bottom in inkTertiary. No URL, no store badge, no QR
code, no text appended to the share intent. Write to cache via FileProvider and hand to
ACTION_SEND as image/png.

Icon — black field edge to edge, a single thin accent arc rising from the lower edge: a
sliver of light clipped by the frame. Stroke 4% of icon width. No letterform, no gradient,
no bevel, no shadow. Must read at 48px. Adaptive icon with solid #000000 background, arc
foreground at 66% safe zone, plus a monochrome layer for themed icons. The notification
small icon is the same arc, pure white, 24dp monochrome silhouette, transparent background.

## ARCHITECTURE

Kotlin 2.x, AGP 8.7+, JDK 17, compileSdk 36, targetSdk 36, minSdk 26.
Single Activity, Jetpack Compose, Material3 heavily overridden. Unidirectional data flow:
each screen exposes one immutable UiState from a StateFlow and takes events as function
references. No mutableStateOf reaching across screen boundaries.

  app/
    MainActivity.kt  NourApp.kt  di/AppContainer.kt      manual DI, no Hilt
    data/   AffirmationSource  DayEngine  SettingsStore  CycleStore  ReadStore  FastCache
    notify/ Scheduler  AlarmReceiver  BootReceiver  Notifier  Watchdog
    ui/     theme/{Color,Type,Shape,Motion,Theme}  today/  archive/  settings/
            onboarding/  share/  components/

Complete dependency list — nothing else enters build.gradle.kts without deleting something:
  androidx.compose BOM (latest stable) + material3, activity-compose,
  lifecycle-viewmodel-compose, lifecycle-runtime-compose,
  datastore-preferences, work-runtime-ktx, core-splashscreen, kotlinx-serialization-json.
No Room (the archive is computed), no network layer, no Hilt, no Firebase, no analytics.

Permissions, and only these: POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM,
RECEIVE_BOOT_COMPLETED, VIBRATE. No INTERNET.

Accessibility: TalkBack must read the affirmation as ONE sentence — merge the per-line Text
composables with semantics(mergeDescendants = true) and an explicit contentDescription
carrying the whole string; per-line reading is a bug. Font scale to 1.5x must not clip or
truncate. All targets >= 48dp. inkTertiary only at eyebrow/caption sizes, never for
anything a user must read to operate the app. Honour reduced motion.

## HOW TO WORK

Work in phases. At the end of each phase, build, run the tests you wrote for it, and
report what passed before moving on. Do not jump ahead and do not leave a phase partly
done.

  Phase 1  Project skeleton: Gradle, manifest, bundled fonts, full theme layer
           (Color/Type/Shape/Motion), AppContainer. Gate: debug APK assembles, a blank
           true-black Activity launches.
  Phase 2  Data layer: affirmations.json with 40 placeholder lines, AffirmationSource with
           validation, DayEngine, CycleStore, SettingsStore, ReadStore, FastCache.
           Gate: the full DayEngine test suite below is green.
  Phase 3  Today screen with the Reveal, optical sizing, read registration, streak footer,
           long-press sheet. Gate: Reveal reaches final state under test; reduced-motion
           path verified.
  Phase 4  Notification engine: channel, Notifier with the teaser build and hook rotation,
           Scheduler with the exact/window decision, AlarmReceiver chain, BootReceiver,
           Watchdog, caps and ledger. Gate: cap and nudge-suppression tests green over a
           simulated year.
  Phase 5  Onboarding, Archive, Settings, Share card, icon and adaptive icon layers.
  Phase 6  Hardening: R8 minify and resource shrink, accessibility pass, performance pass,
           the manual matrix below, store strings.

Commit at every phase gate with a conventional-commit subject and a body stating what the
phase proved. Work on the current development branch. Do not open a pull request unless
asked.

## DEFINITION OF DONE

Automated
  DayEngine: same date -> same item across 10k launches; no repeat within n days; a full
  cycle covers every item exactly once; the cycle roll never repeats across the seam;
  negative offsets resolve from the retained previous order; DST and leap days resolve; a
  timezone change mid-cycle does not throw.
  Hook rotation: no repeat within 16 days; the stride is co-prime with the bank size.
  Notifications: nudge suppressed when read, when >= 21:00, on consecutive days, and
  beyond 3 per week; the 9-per-7-days cap holds over a simulated year.
  Content validation: malformed, empty, duplicate-id, emoji-bearing and over-long items
  are rejected without crashing.
  Compose: Reveal reaches final state; archive renders 60 rows without recomposition
  storms; settings persist across process death.

Manual — do not declare done without running every one
  reboot -> fires · doze (adb shell dumpsys deviceidle force-idle) -> fires · flight to
  another timezone -> one line per local day, no double fire · DST forward and back · app
  update -> alarm survives · exact-alarm denied -> falls back and the Settings row appears
  · notification permission denied -> app fully usable · force stop -> next launch re-arms.

Performance
  Cold start to visible sentence under 400ms on a mid-range device · zero dropped frames
  during the Reveal · release APK under 4 MB · no jank in the archive at 60 rows.

Report honestly at the end: what is built and verified, what is built but unverified on
real hardware, and what is deferred. Do not describe a manual test as passed if you could
not run it in this environment — list it as pending with the exact adb command to run.
```
