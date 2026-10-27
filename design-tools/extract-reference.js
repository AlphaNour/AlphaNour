#!/usr/bin/env node
/*
 * extract-reference.js — turn a reference website into design evidence.
 *
 * Captures full-page screenshots at three breakpoints and extracts the
 * design tokens actually used on the page (fonts, type scale, colours,
 * radii, container widths) by reading computed styles.
 *
 * Usage:
 *   node extract-reference.js <url> [outDir]
 *
 * Example:
 *   node extract-reference.js https://www.vanta.com ./refs/vanta
 *
 * Setup (once):
 *   npm install playwright
 *   npx playwright install chromium
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BREAKPOINTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

// Read every element's computed styles and tally what the page actually uses.
// Runs inside the page, so it sees the rendered result rather than the CSS source.
function collectTokens() {
  const tally = (map, key) => {
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  };
  const top = (map, n) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));

  const fonts = new Map();
  const sizes = new Map();
  const weights = new Map();
  const colors = new Map();
  const backgrounds = new Map();
  const radii = new Map();
  const widths = new Map();
  const headings = [];

  const isPaint = (v) =>
    v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent' && !v.startsWith('none');

  for (const el of document.querySelectorAll('*')) {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) continue; // skip anything not rendered
    const s = getComputedStyle(el);

    tally(fonts, s.fontFamily);
    tally(weights, s.fontWeight);
    if (isPaint(s.color)) tally(colors, s.color);
    if (isPaint(s.backgroundColor)) tally(backgrounds, s.backgroundColor);
    if (s.borderRadius !== '0px') tally(radii, s.borderRadius);

    // Only tally type sizes where there is real text, so wrappers do not skew it.
    const text = el.textContent ? el.textContent.trim() : '';
    if (text && el.children.length === 0) tally(sizes, s.fontSize);

    if (s.maxWidth !== 'none') tally(widths, s.maxWidth);

    if (/^H[1-6]$/.test(el.tagName) && text) {
      headings.push({
        level: el.tagName,
        size: s.fontSize,
        weight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        text: text.slice(0, 120),
      });
    }
  }

  const sectionTags = [...document.querySelectorAll('section, main > div, main > article')]
    .map((el) => {
      const h = el.querySelector('h1, h2, h3');
      return h ? h.textContent.trim().slice(0, 100) : null;
    })
    .filter(Boolean);

  return {
    url: location.href,
    title: document.title,
    fonts: top(fonts, 6),
    typeScale: top(sizes, 14),
    weights: top(weights, 8),
    textColors: top(colors, 10),
    backgrounds: top(backgrounds, 10),
    radii: top(radii, 6),
    containerWidths: top(widths, 6),
    headings: headings.slice(0, 40),
    sectionOrder: sectionTags.slice(0, 30),
  };
}

function toMarkdown(t) {
  const rows = (list) => list.map((x) => `- \`${x.value}\` (${x.count}×)`).join('\n');
  return `# Design reference: ${t.title}

${t.url}

## Fonts
${rows(t.fonts)}

## Type scale (most used first)
${rows(t.typeScale)}

## Font weights
${rows(t.weights)}

## Text colours
${rows(t.textColors)}

## Backgrounds
${rows(t.backgrounds)}

## Border radii
${rows(t.radii) || '- none (fully square)'}

## Container widths
${rows(t.containerWidths)}

## Headings in order
${t.headings.map((h) => `- **${h.level}** ${h.size}/${h.lineHeight} w${h.weight} — ${h.text}`).join('\n')}

## Section order
${t.sectionOrder.map((s, i) => `${i + 1}. ${s}`).join('\n')}
`;
}

async function main() {
  const [url, outArg] = process.argv.slice(2);
  if (!url) {
    console.error('Usage: node extract-reference.js <url> [outDir]');
    process.exit(1);
  }

  const slug = new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-');
  const outDir = path.resolve(outArg || path.join('refs', slug));
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    let tokens = null;

    for (const bp of BREAKPOINTS) {
      const page = await browser.newPage({
        viewport: { width: bp.width, height: bp.height },
        deviceScaleFactor: 2,
      });
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

      // Scroll the full height so lazy-loaded images and reveal animations fire.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 180));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);

      const shot = path.join(outDir, `${bp.name}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      console.log(`screenshot  ${shot}`);

      if (bp.name === 'desktop') tokens = await page.evaluate(collectTokens);
      await page.close();
    }

    fs.writeFileSync(path.join(outDir, 'tokens.json'), JSON.stringify(tokens, null, 2));
    fs.writeFileSync(path.join(outDir, 'REFERENCE.md'), toMarkdown(tokens));
    console.log(`tokens      ${path.join(outDir, 'tokens.json')}`);
    console.log(`summary     ${path.join(outDir, 'REFERENCE.md')}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
