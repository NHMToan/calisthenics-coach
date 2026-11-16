// Renders the app icon, Android adaptive icon layers, splash image and favicon from assets/brand/mark.svg.
// Usage: node scripts/gen-icons.cjs
// Needs `sharp`, which is not an app dependency: run `npm i --no-save sharp` first (or set SHARP_PATH).
const fs = require('fs');
const path = require('path');

const sharp = require(process.env.SHARP_PATH || 'sharp');
const A = (f) => path.join(__dirname, '..', 'assets', f);
const BG = '#07090D'; // colors.bg
const mark = fs.readFileSync(A('brand/mark.svg'), 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** The 1024 mark scaled by `scale` and centred on a size×size canvas, optionally on the dark background or in white. */
function svg(size, scale, { bg = false, mono = false } = {}) {
  const s = (size / 1024) * scale;
  const off = (size - 1024 * s) / 2;
  const body = mono ? inner.replace(/url\(#g\)/g, '#FFFFFF') : inner;
  const back = bg
    ? `<rect width="${size}" height="${size}" fill="${BG}"/>
       <radialGradient id="glow" cx="0.5" cy="0.45" r="0.6"><stop offset="0" stop-color="#C6F432" stop-opacity="0.16"/><stop offset="1" stop-color="#C6F432" stop-opacity="0"/></radialGradient>
       <rect width="${size}" height="${size}" fill="url(#glow)"/>`
    : '';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${back}<g transform="translate(${off} ${off}) scale(${s})">${body}</g></svg>`);
}

const png = (buf, file, { flatten = false } = {}) => {
  let img = sharp(buf);
  if (flatten) img = img.flatten({ background: BG }); // iOS rejects icons with transparent pixels
  return img.png().toFile(A(file));
};

(async () => {
  await png(svg(1024, 0.84, { bg: true }), 'icon.png', { flatten: true });
  // adaptive icon: launchers crop the 512 layer to a shape, so the mark stays inside the centre safe zone
  await png(svg(512, 0.68), 'android-icon-foreground.png');
  await png(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="${BG}"/></svg>`), 'android-icon-background.png');
  await png(svg(432, 0.68, { mono: true }), 'android-icon-monochrome.png');
  await png(svg(1024, 1), 'splash-icon.png'); // transparent; shown at `imageWidth` from app.json
  await png(svg(48, 0.9, { bg: true }), 'favicon.png', { flatten: true });
  console.log('icons written to assets/');
})();
