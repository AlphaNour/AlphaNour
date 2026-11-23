# NOUR — Product & Technical Specification
Version 1.0 · Android · Kotlin / Jetpack Compose

Read alongside `BRAND.md`. Where they conflict, `BRAND.md` wins on appearance,
this file wins on behaviour.

---

## 1. Scope

**v1.0 ships exactly this:**
1. One affirmation per calendar day, identical all day, deterministic, offline.
2. A daily notification engineered to be opened.
3. An archive of every past day (computed, not stored).
4. Favourites.
5. Share as an image card.
6. Settings: reminder time, second reminder, haptics, text size.

**Explicitly deferred:** home-screen widget (v1.1), journalling, categories/themes,
audio, light theme, cloud sync, accounts, in-app purchase, any form of feed.

---

## 2. The Day Engine

### Requirement
Same calendar day → same affirmation, every launch, every timezone, no network, no
repeats until the whole list is exhausted, and any past date must be reconstructible.

### Design
Do **not** pick randomly and store the result. Do **not** use `hash(date) % size` —
that collides and repeats early.

```
On first launch:
  seed            = SecureRandom.nextLong()
  order           = fisherYatesShuffle(indices(0..n-1), seed)   // persisted as List<Int>
  cycleStartDay   = LocalDate.now(zone).toEpochDay()
  cycle           = 0

For any date d:
  offset = d.toEpochDay() - cycleStartDay
  if offset in 0 until order.size  -> affirmation = list[order[offset]]
  if offset >= order.size          -> roll the cycle forward (below), then resolve
  if offset < 0                    -> derive from the previous cycle's stored order
```

**Rolling a cycle:** when `offset >= order.size`, advance
`cycleStartDay += order.size`, `cycle += 1`, reshuffle with `seed xor cycle`, and if the
new order's first element equals the previous order's last element, swap it with index 1.
Keep the last two orders persisted so the archive stays resolvable backwards.

Day boundary is **local midnight**, `LocalDate.now(ZoneId.systemDefault()).toEpochDay()`.
Crossing timezones may hand the user a different line for the same subjective day; that
is accepted and documented.

### Content file
`app/src/main/assets/affirmations.json`

```json
{
  "version": 1,
  "items": [
    { "id": "a001", "text": "I move first, then I feel ready.", "emphasis": "first", "tags": ["action"] }
  ]
}
```

- `emphasis` is optional — a single word rendered italic. Never set by code.
- Validated on load: non-empty, unique ids, 3–180 chars, no trailing whitespace,
  no emoji codepoints, `emphasis` must occur verbatim in `text`. Invalid item → skipped
  and logged, never crashes.
- Ship with 40 placeholder lines so the app runs on day one. The real list drops into
  this file with **zero code changes**. If `items.size` changes between releases, the
  persisted `order` is rebuilt and `cycleStartDay` is reset to today — the archive before
  that point resolves from the retained previous order.

---

## 3. Screens

### 3.1 Today — the entire app
```
┌──────────────────────────────┐
│                         ⋯    │  44dp target, top-right, 16dp inset
│                              │
│                              │
│  SAT 23 NOVEMBER             │  eyebrow, inkTertiary
│                              │  24dp gap
│  I move first, then          │  affirmation, inkPrimary
│  I feel ready.               │  left-aligned, optically centred at 46%
│                              │
│                              │
│                              │
│  Day 14 · next at 07:30      │  caption, inkTertiary — appears after dwell
└──────────────────────────────┘
```
- No app bar, no title, no logo, no back affordance.
- `⋯` opens a bottom sheet with three rows: **Archive**, **Settings**, **Share today**.
- Long-press the affirmation → the same sheet plus **Favourite** and **Copy**.
- The footer line fades in only once the read is registered (§5).
- Pull-to-refresh: absent. There is nothing to refresh.
- Scrolling: absent. The screen is fixed. If text would overflow, the optical sizing
  rule shrinks it.

### 3.2 Archive
Vertical list, newest first, back to install date. Each row: `11sp` date eyebrow, then
the affirmation at `body` size clamped to 2 lines with a true ellipsis. Hairline between
rows, no cards, no chevrons. A single pill at the top toggles **All / Favourites**.
Tap a row → full-screen read using the Today type treatment, with no reveal animation
and a 48dp close target top-left.

### 3.3 Settings
One column, hairline-separated rows, no section cards.
- **Reminder** — time, opens a themed time picker. Presets offered above the wheel:
  `On waking 07:00` · `With coffee 07:30` · `Start of work 09:00` · `Evening 21:00`.
- **Second reminder** — switch. Copy: *"If the first one goes unread, one quiet nudge
  five hours later."*
- **Exact delivery** — only rendered when the OS has denied exact alarms. Copy:
  *"Android is batching your reminder. Allow exact timing so it lands at 07:30."* →
  deep links to `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`.
- **Haptics** — switch.
- **Text size** — three steps: Standard / Large / Larger (scales the affirmation tier
  by 1.0 / 1.15 / 1.3 before the optical sizing rule runs).
- **Share Nour**, **Licences**, **Version**.

No "restore purchases", no "sign in", no "feedback" form, no theme picker.

### 3.4 Onboarding — three screens, under twenty seconds
1. **The promise.** One sentence: *"One line a day. Nothing else."* → `Continue`
2. **The appointment.** *"When do you want it?"* Four preset pills + `Choose another time`.
   Default pre-selected: 07:30. → `Continue`
3. **The permission.** *"Nour sends one notification a day. Nothing else."* →
   `Turn on reminders` triggers the system `POST_NOTIFICATIONS` dialog.
   A text-only `Not now` sits below it, same size, no colour.

Then straight into Today with the full Reveal. Never shown again. No account, no name,
no goals quiz, no "what brings you here" survey.

### 3.5 Share card
Rendered off-screen at 1080×1920 (and 1080×1080) per `BRAND.md` §9, written to cache via
`FileProvider`, handed to `ACTION_SEND` with `image/png`. No watermark beyond the
wordmark. No text appended to the share intent.

---

## 4. The Notification Engine

This is the hardest part of the product and most of its value. An affirmation app with a
beautiful screen and a notification nobody taps is a failed app.

### 4.1 The core mechanic — teaser, not payload
**The notification must not contain the affirmation.** If it does, the user reads it on
the lock screen and never opens the app, and the ritual never forms.

```
Title:  rotating hook, 2–5 words, no terminal punctuation
Body:   first 4–6 words of today's affirmation + " …"
```

Example: title `today's line is ready` / body `I move first, then …`

Rules:
- No `BigTextStyle`. Expanding must reveal nothing new.
- No action buttons. The whole notification is the target.
- No large icon, no image, no progress, no chronometer.
- `setAutoCancel(true)`, `setOnlyAlertOnce(true)`, one reused notification id.
- Truncate the body at a word boundary, never mid-word, never past 32 characters.

### 4.2 Hook rotation
A bank of 16 titles, selected by `dayIndex % 16` walked through a co-prime stride (e.g.
`(dayIndex * 7) % 16`) so consecutive days never feel adjacent, and no title repeats
inside 16 days. Ship these; they are the voice:

```
1   today's line is ready
2   one line, then go
3   something for this morning
4   a thought before the day starts
5   this one is yours
6   read this once
7   {n} words, that's all          // n = today's word count, computed
8   your line for today
9   open, then close
10  keep this one close
11  for the next twelve hours
12  before anything else
13  short, on purpose
14  ten seconds
15  the quiet part of the morning
16  it's waiting
```

Nudge titles are a different register and a separate bank of four:
`still unread` · `it's still there` · `whenever you're ready` · `no rush, it's short`

### 4.3 Timing
- Default **07:30 local**, user-settable to the minute.
- Anchored to an existing habit, not a round hour, because round hours are when every
  other app fires. The presets steer toward a real moment (waking, coffee, desk).
- **Nudge:** fires at `T + 5h` only if *all* of: today's line is unread, local time is
  ≤ 21:00, no nudge was sent yesterday, fewer than 3 nudges in the last 7 days.
- **Hard cap: 9 notifications in any rolling 7 days.** Enforced in code, not by policy.
- **Zero notifications once the day's line has been read.** Cancel any pending nudge the
  moment the read registers.

### 4.4 Delivery reliability — the checklist most apps fail
- Use `AlarmManager.setExactAndAllowWhileIdle`, **not** `WorkManager`, for the moment of
  delivery. WorkManager batches and can drift 10+ minutes; a 07:30 reminder that lands
  at 07:52 is a different product.
- Request `SCHEDULE_EXACT_ALARM`; check `AlarmManager.canScheduleExactAlarms()` on every
  arm. Do **not** declare `USE_EXACT_ALARM` — Play policy restricts it to alarm clocks
  and calendars, and an affirmations app will be rejected for it.
- If exact is denied: fall back to `setWindow(..., 15 min window)` plus the WorkManager
  watchdog, and surface the Settings row in §3.3. Never silently degrade.
- **One-shot chain, not a repeating alarm.** Each fire arms the next one. Repeating
  alarms are inexact on modern Android and drift.
- Re-arm on: `BOOT_COMPLETED`, `MY_PACKAGE_REPLACED`, `TIMEZONE_CHANGED`, `TIME_SET`,
  time-setting change in Settings, and every cold start.
- **Watchdog:** a `PeriodicWorkRequest` every 6 hours that asserts (a) a next alarm
  exists and (b) today's notification was posted if its time has passed. Re-arms or
  posts late if not. This is what keeps the streak alive on aggressive OEM ROMs.
- Battery optimisation: if the watchdog records two missed fires in 14 days, show a
  single, dismissible, never-repeated row in Settings offering
  `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. Do not gate onboarding on it.
- Force-stop by the user kills alarms until next launch. Unavoidable. Documented.
- `POST_NOTIFICATIONS` is requested in onboarding screen 3, after value is shown — never
  on cold launch. If denied, the app still works and Settings offers one non-nagging path
  back.

### 4.5 Channel
One channel, id `daily`, name `Daily line`, `IMPORTANCE_HIGH`.
`setSound(null)` — silent — with a short vibration pattern. High importance still
produces a heads-up banner; silence is what makes it feel expensive rather than needy.
No lights, no badge.

### 4.6 From tap to sentence — the open path
The click is only worth anything if the payoff is instant.
- `PendingIntent` → `MainActivity` with extras `source=notification`, `date=<epochDay>`.
  Launch mode `singleTop`, no task clearing, no router activity, no deep-link library.
- **First frame must already contain the affirmation.** When the alarm fires, write
  today's text into plain `SharedPreferences` (`today_text`, `today_epoch_day`). The
  Activity reads that key synchronously in `onCreate` before `setContent`, so the first
  composition has real content. DataStore is coroutine-only and will cost you a blank frame.
- `SplashScreen` API: black, no icon animation, `keepOnScreenCondition` false immediately.
- Budget: **cold start to visible sentence under 400ms** on a mid-range device.
- The Reveal (`BRAND.md` §7) plays when `source=notification` or on the first open of the
  day. Otherwise render at final state. The animation is the reward for the tap.

---

## 5. Read registration & streak

A read registers when the Today screen has been continuously visible (`RESUMED`) for
**2.5 seconds** with today's affirmation displayed. There is no button.

On registration: cancel today's pending nudge · increment the streak if yesterday was
read, else reset to 1 · persist `lastReadEpochDay` · fade in the footer
`Day {n} · next at {time}`.

The streak is a single line of `caption` text. It is never a ring, a flame, a badge, a
counter in the app bar, or a push notification. Breaking it produces no message, no
"you lost your streak", no recovery offer. It simply starts at 1 again.

---

## 6. Architecture

```
app/
  MainActivity.kt                  single activity, Compose host
  NourApp.kt                       Application, builds AppContainer
  di/AppContainer.kt               manual DI — no Hilt for an app this size
  data/
    AffirmationSource.kt           assets JSON parse + validation
    DayEngine.kt                   deterministic selection (§2) — pure, unit-tested
    SettingsStore.kt               DataStore Preferences
    CycleStore.kt                  seed, order, cycleStart, previous order
    ReadStore.kt                   lastReadEpochDay, streak, nudge ledger
    FastCache.kt                   SharedPreferences for first-frame text
  notify/
    Scheduler.kt                   arm / re-arm / cancel, exact-vs-window decision
    AlarmReceiver.kt               fires, posts, arms next
    BootReceiver.kt                BOOT_COMPLETED, TIMEZONE_CHANGED, TIME_SET, REPLACED
    Notifier.kt                    channel, teaser build, hook rotation, caps
    Watchdog.kt                    PeriodicWork, 6h
  ui/
    theme/                         Color.kt Type.kt Shape.kt Motion.kt Theme.kt
    today/                         TodayScreen, TodayViewModel, Reveal.kt
    archive/                       ArchiveScreen, ArchiveViewModel
    settings/                      SettingsScreen, SettingsViewModel
    onboarding/                    three composables, one ViewModel
    share/                         ShareCardRenderer
    components/                    Hairline, SheetRow, Pill, Switch, TimePicker
```

- Unidirectional data flow. Each screen exposes one immutable `UiState` from a
  `StateFlow`; events go up as function references. No `mutableStateOf` reaching across
  screen boundaries.
- `DayEngine` is a pure function of (date, order, cycleStart, list). It takes a `Clock`
  and a `ZoneId` as parameters so tests can move time. **No `LocalDate.now()` inside it.**
- No `Room` — the archive is computed. No network layer. No analytics SDK. No Firebase.

### Dependencies — the complete list
```
Kotlin 2.x · AGP 8.7+ · JDK 17 · compileSdk 36 · targetSdk 36 · minSdk 26
androidx.compose (BOM, latest stable) + material3
androidx.activity:activity-compose
androidx.lifecycle:lifecycle-viewmodel-compose
androidx.lifecycle:lifecycle-runtime-compose
androidx.datastore:datastore-preferences
androidx.work:work-runtime-ktx
androidx.core:core-splashscreen
org.jetbrains.kotlinx:kotlinx-serialization-json
```
Nothing else enters `build.gradle.kts` without deleting something first.

### Permissions
```
POST_NOTIFICATIONS        (runtime, Android 13+)
SCHEDULE_EXACT_ALARM      (special, Android 12+ — request, do not assume)
RECEIVE_BOOT_COMPLETED
VIBRATE
```
No `INTERNET`. State that in the store listing — it is a feature.

---

## 7. Accessibility

- TalkBack reads the affirmation as a single sentence: merge the per-line `Text`
  composables with `semantics(mergeDescendants = true)` and an explicit
  `contentDescription` holding the whole string. Per-line reading is a bug.
- Font scale to 1.5× must not clip or truncate — the optical sizing rule (`BRAND.md` §5)
  runs after the user's scale is applied.
- All targets ≥ 48dp.
- `inkTertiary` (3.7:1) only at `eyebrow`/`caption` weight-size combinations that qualify
  as large text; never for anything a user must read to operate the app.
- Reduced motion honoured per `BRAND.md` §7.
- Dark-only is a deliberate decision: the affirmation sits at 19:1 contrast, above AAA.

---

## 8. Quality bar — definition of done

**Automated**
- `DayEngine`: same date → same item across 10k launches; no repeat within `n` days;
  full cycle covers every item exactly once; cycle roll never repeats across the seam;
  negative offsets resolve from the retained previous order; DST days and leap days
  resolve; timezone changed mid-cycle does not throw.
- Hook rotation: no title repeats within 16 days; stride is co-prime with the bank size.
- Notification caps: nudge suppressed when read · when ≥ 21:00 · on consecutive days ·
  beyond 3/week; hard cap of 9/7 days holds under a simulated year.
- Content validation: malformed, empty, duplicate-id, emoji-bearing and over-long items
  are rejected without crashing.
- Compose UI tests: Reveal reaches final state; archive renders ≥ 30 rows without
  recomposition storms; settings toggles persist across process death.

**Manual matrix — do not ship without running these**
- Reboot → reminder still fires
- Doze (`adb shell dumpsys deviceidle force-idle`) → fires
- Flight to another timezone → one line per local day, no double-fire
- DST forward and back
- App update (`MY_PACKAGE_REPLACED`) → alarm survives
- Exact-alarm permission denied → falls back, Settings row appears
- Notification permission denied → app fully usable
- Force stop → next launch re-arms

**Performance**
- Cold start to visible sentence < 400ms (mid-range device)
- Reveal with zero dropped frames
- Release APK < 4 MB, R8 minify + resource shrink on
- Zero jank in the archive at 60 rows

---

## 9. Store listing

- Title: `Nour — One Line a Day`
- Short description: `One affirmation a day. No feed, no account, no noise.`
- Long description: five short paragraphs, no emoji, no feature bullet soup, no
  exclamation marks. Lead with the restraint. State that the app has no internet
  permission and collects nothing.
- Screenshots: five, each a real screen on true black, each with one line of 11sp
  uppercase caption in the dead space. No device frames, no gradient backgrounds, no
  "As seen in", no arrows pointing at features.
- Data safety: no data collected, no data shared. Fill it in honestly and it is empty.
