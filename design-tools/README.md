# design-tools

Turn a reference website into design evidence Claude can actually reason about:
full-page screenshots at three breakpoints, plus the design tokens the page
really uses (fonts, type scale, colours, radii, container widths).

Screenshots alone tell Claude what a site feels like. Tokens tell it the exact
numbers to reuse. You want both.

## Setup (once)

```bash
cd design-tools
npm install playwright
npx playwright install chromium
```

## Use

```bash
node extract-reference.js https://www.vanta.com
```

Writes into `refs/vanta-com/`:

| File | What it is |
|---|---|
| `desktop.png` | Full page at 1440px |
| `tablet.png` | Full page at 834px |
| `mobile.png` | Full page at 390px |
| `tokens.json` | Machine-readable tokens |
| `REFERENCE.md` | The same thing, readable |

Pick your own output folder with a second argument:

```bash
node extract-reference.js https://www.anduril.com ./refs/anduril
```

## Then hand it to Claude

```
Read design-tools/refs/vanta-com/REFERENCE.md and look at desktop.png
and mobile.png. Extract the rules that make this page feel credible:
type scale, spacing rhythm, how many colours, section shapes, where
proof sits. Write them as a design skill for Reengineera.
```

## Notes

- Captures the public page only. Anything behind a login will not render.
- The script scrolls the whole page first so lazy-loaded images and reveal
  animations have fired before the screenshot.
- Tokens come from computed styles on rendered elements, so they reflect what
  ships, not what the stylesheet claims.
- Use the output as reference for your own design decisions. Do not copy a
  competitor's copy, brand marks, or photography.
