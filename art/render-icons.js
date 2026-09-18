/**
 * Renders the app icons from art/fox.svg with headless Chromium.
 * Run: node art/render-icons.js   (needs playwright available to node)
 */
const fs = require('fs');
const path = require('path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const svg = fs.readFileSync(path.join(__dirname, 'fox.svg'), 'utf8');
const mono = svg
  .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"')
  .replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#FFFFFF"')
  .replace(/opacity="[0-9.]+"/g, '');
const CREAM = '#F8F2E9';

const targets = [
  // iOS/App icon: cream tile, fox at ~72%. Apple applies its own mask.
  { file: 'assets/icon.png', size: 1024, bg: CREAM, foxPct: 0.74, art: svg },
  // Android adaptive: foreground must keep the fox inside the centre 66%.
  { file: 'assets/android-icon-foreground.png', size: 1024, bg: 'transparent', foxPct: 0.58, art: svg },
  { file: 'assets/android-icon-background.png', size: 1024, bg: CREAM, foxPct: 0, art: '' },
  { file: 'assets/android-icon-monochrome.png', size: 1024, bg: 'transparent', foxPct: 0.58, art: mono },
  // Splash: transparent, contained on the cream splash background.
  { file: 'assets/splash-icon.png', size: 1024, bg: 'transparent', foxPct: 0.5, art: svg },
  { file: 'assets/favicon.png', size: 96, bg: 'transparent', foxPct: 1, art: svg },
];

(async () => {
  const browser = await chromium.launch();
  for (const t of targets) {
    const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
    const fox = Math.round(t.size * t.foxPct);
    await page.setContent(
      `<body style="margin:0;width:${t.size}px;height:${t.size}px;background:${t.bg};display:flex;align-items:center;justify-content:center">` +
        (fox ? `<div style="width:${fox}px;height:${fox}px">${t.art}</div>` : '') +
        `</body>`,
    );
    await page.screenshot({
      path: path.join(__dirname, '..', t.file),
      omitBackground: t.bg === 'transparent',
    });
    await page.close();
    console.log('wrote', t.file);
  }
  await browser.close();
})();
