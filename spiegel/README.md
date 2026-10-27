# 🪞 Spiegel

A phone app that teaches German through **Self-Narrative Fading**: you tell a
short story from your real day in English, the app mirrors it back with German
woven in at your level, and over the following days the German fades into gaps
you fill from memory, until you tell your life in German.

## Roadmap

| # | Structure | Status |
|---|---|---|
| 1 | [Method spec](docs/01-method-spec.md) | ✅ Draft |
| 2 | [Data model](docs/02-data-model.md) (local-first SQLite on the phone) | ✅ Draft |
| 3 | AI engine (backend + Claude API: weave, tag, fade, correct) | ⏳ Next |
| 4 | Memory engine (FSRS scheduling + fade levels) | ⬜ |
| 5 | Voice layer (speech-to-text, German text-to-speech) | ⬜ |
| 6 | Phone app (Expo / React Native): Tell → Mirror → Fade → Speak → Book | ⬜ |
| 7 | Level tracker (Stufe level-up logic) | ⬜ |
| 8 | Ship (Android APK / Play internal testing) | ⬜ |

## v1 settings

- Helper language: English
- Starting level: absolute beginner (Stufe 1)
- Platform: Android first, via Expo (React Native)
