// Generates the source images @capacitor/assets needs.
// School-themed icon: a white graduation cap on the Lumina purple gradient.
// Run: node scripts/make-icons.mjs   then   npx capacitor-assets generate --android
import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

const OUT = fileURLToPath(new URL("../assets/", import.meta.url));
mkdirSync(OUT, { recursive: true });

// Open-book motif drawn in a 0..100 local coordinate space.
// Two white pages with a spine gap, plus faint text lines.
const cap = (fill, lineColor) => `
  <path d="M48 40 C 37 34, 22 33, 11 35 L11 61 C22 59, 37 60, 48 66 Z" fill="${fill}"/>
  <path d="M52 40 C 63 34, 78 33, 89 35 L89 61 C78 59, 63 60, 52 66 Z" fill="${fill}"/>
  ${lineColor ? `<g fill="${lineColor}" opacity="0.5">
    <rect x="16" y="42.5" width="26" height="2.2" rx="1.1"/>
    <rect x="16" y="48"   width="26" height="2.2" rx="1.1"/>
    <rect x="16" y="53.5" width="23" height="2.2" rx="1.1"/>
    <rect x="58" y="42.5" width="26" height="2.2" rx="1.1"/>
    <rect x="58" y="48"   width="26" height="2.2" rx="1.1"/>
    <rect x="61" y="53.5" width="23" height="2.2" rx="1.1"/>
  </g>` : ""}
`;

const purpleBg = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#5b1fd6"/><stop offset="1" stop-color="#9b3bff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#b985ff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#b985ff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// adaptive background (full-bleed gradient)
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${purpleBg}
  <rect width="1024" height="1024" fill="url(#g)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
</svg>`;

// adaptive foreground (white cap, centered within the safe zone, transparent bg)
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(212,215) scale(6)">${cap("#ffffff", "#7a2fff")}</g>
</svg>`;

// full legacy/round icon (gradient + white cap)
const iconOnlySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${purpleBg}
  <rect width="1024" height="1024" rx="220" fill="url(#g)"/>
  <rect width="1024" height="1024" rx="220" fill="url(#glow)"/>
  <g transform="translate(162,166) scale(7)">${cap("#ffffff", "#7a2fff")}</g>
</svg>`;

// dark splash with a brand-tinted cap (matches the app's #06061a background)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <defs>
    <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ede6ff"/><stop offset="1" stop-color="#863bff"/>
    </linearGradient>
    <radialGradient id="bgglow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#1a0b4d" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#06061a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="2732" height="2732" fill="#06061a"/>
  <rect width="2732" height="2732" fill="url(#bgglow)"/>
  <g transform="translate(716,722) scale(13)">${cap("url(#gl)", "")}</g>
</svg>`;

async function png(svg, name, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(OUT, name));
  console.log("wrote", name);
}

await png(iconOnlySvg, "icon-only.png", 1024);
await png(fgSvg, "icon-foreground.png", 1024);
await png(bgSvg, "icon-background.png", 1024);
await png(splashSvg, "splash.png", 2732);
await png(splashSvg, "splash-dark.png", 2732);
console.log("done");
