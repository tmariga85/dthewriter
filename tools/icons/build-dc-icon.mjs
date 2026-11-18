/*
 * Builds the main site's favicon from the brand logo.
 *
 * assets/images/dc-black.svg is the full lockup: a large DC monogram with a
 * white band struck through it carrying "DISTINCTIVE CREATIVES". At 32px that
 * wordmark is an illegible smear, so the icon uses the monogram alone, which
 * is the part that still reads at tab size.
 *
 * The two glyph outlines are lifted straight out of the logo file rather than
 * redrawn, so the icon cannot drift away from the brand. Their bounding box is
 * found by rendering and trimming rather than by arithmetic on the path data.
 *
 *   npm i sharp && node tools/icons/build-dc-icon.mjs
 */

import fs from 'fs';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url).pathname.slice(1);
const src = fs.readFileSync(root + 'assets/images/dc-black.svg', 'utf8');
const out = root + 'assets/images/';

// The D and the C are the two glyphs placed on the logo's baseline at y 165.
// Everything else in the file is the wordmark and the white band.
const glyphs = [...src.matchAll(
  /<g transform="translate\((1[47]3\.[\d.]+|273\.[\d.]+),\s*165\.032026\)"><g><path d="([^"]+)"/g
)].map(m => ({ x: parseFloat(m[1]), d: m[2] }));

if (glyphs.length !== 2) {
  console.error('expected the D and the C, found ' + glyphs.length + ' glyph(s)');
  process.exit(1);
}
console.log('lifted ' + glyphs.length + ' glyphs from the logo');

// The logo is a high-contrast serif: its hairlines are about a fifth the
// width of its stems. Shrunk to 32px those hairlines fall below a pixel and
// wash out to pale grey, so the small icon gets the outline stroked to carry
// a little more weight. The large sizes are left exactly as drawn.
const mono = (stroke) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525 217.5" width="2100" height="870">
  ${glyphs.map(g => `<g transform="translate(${g.x}, 165.032026)"><path d="${g.d}" fill="#000"` +
      (stroke ? ` stroke="#000" stroke-width="${stroke}" stroke-linejoin="round"` : '') + `/></g>`).join('\n  ')}
</svg>`;

// Render, then trim the transparent surround to get the monogram's true box.
const render = async (stroke) => sharp(Buffer.from(mono(stroke)), { density: 300 })
  .trim({ threshold: 1 }).png().toBuffer();

const plain = await render(0);
const bold = await render(7);
const meta = await sharp(plain).metadata();
console.log('monogram trims to ' + meta.width + 'x' + meta.height);

for (const size of [32, 180, 512]) {
  const pad = Math.round(size * (size <= 32 ? 0.08 : 0.16));   // tighter when tiny
  const inner = size - pad * 2;
  const glyph = await sharp(size <= 32 ? bold : plain)
    .resize({ width: inner, height: inner, fit: 'inside' })
    .toBuffer();
  const g = await sharp(glyph).metadata();

  const radius = Math.round(size * 0.1875);
  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
       <rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/>
     </svg>`);

  await sharp(plate)
    .composite([{ input: glyph, left: Math.round((size - g.width) / 2), top: Math.round((size - g.height) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out + 'icon-' + size + '.png');
  console.log('wrote assets/images/icon-' + size + '.png');
}

// A real /favicon.ico at the site root as well. Browsers ask for it whatever
// the link tags say, so without one every page load carries a 404. An ICO may
// hold a PNG directly, so this is the 32px icon in a 22-byte container.
const png = fs.readFileSync(out + 'icon-32.png');
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);        // reserved
header.writeUInt16LE(1, 2);        // type: icon
header.writeUInt16LE(1, 4);        // one image
header.writeUInt8(32, 6);          // width
header.writeUInt8(32, 7);          // height
header.writeUInt8(0, 8);           // palette size: none
header.writeUInt8(0, 9);           // reserved
header.writeUInt16LE(1, 10);       // colour planes
header.writeUInt16LE(32, 12);      // bits per pixel
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);      // offset to the image data
fs.writeFileSync(root + 'favicon.ico', Buffer.concat([header, png]));
console.log('wrote favicon.ico (' + (22 + png.length) + ' bytes)');
