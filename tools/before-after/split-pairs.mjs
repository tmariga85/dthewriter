/*
 * Splits the supplied before/after artwork into the four tiles the home
 * services section cross-fades between.
 *
 * Each supplied file is 2000x667 and holds two panels side by side with a pale
 * gutter between them. The "before" sheet also carries a cream frame and
 * rounded corners, so its panels sit inset and are a slightly different shape
 * from the "after" ones. Both are cropped to a common 3:2 so the two states
 * line up while they dissolve into each other.
 *
 *   npm i sharp && node tools/before-after/split-pairs.mjs
 */

import sharp from 'sharp';

const here = new URL('./', import.meta.url).pathname.slice(1);
const out = new URL('../../assets/images/elevating/', import.meta.url).pathname.slice(1);

const OUT_W = 1000, OUT_H = 667;            // 3:2, the aspect the tiles use

// [source, x, y, width, height, destination]
const PANELS = [
  ['before-supplied.webp',   14, 12, 979, 637, 'home-living-before.jpg'],
  ['before-supplied.webp', 1008, 12, 978, 637, 'home-pantry-before.jpg'],
  ['after-supplied.webp',     0,  0, 993, 667, 'home-living-after.jpg'],
  ['after-supplied.webp',  1006,  0, 994, 667, 'home-pantry-after.jpg'],
];

for (const [src, x, y, w, h, dest] of PANELS) {
  // Trim to 3:2 about the centre before resizing, so nothing is stretched.
  const target = OUT_W / OUT_H;
  let cw = w, ch = h;
  if (w / h > target) { cw = Math.round(h * target); } else { ch = Math.round(w / target); }
  const cx = x + Math.round((w - cw) / 2), cy = y + Math.round((h - ch) / 2);

  await sharp(here + src)
    .extract({ left: cx, top: cy, width: cw, height: ch })
    .resize(OUT_W, OUT_H, { fit: 'fill' })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out + dest);
  console.log(`${dest}  from ${src} ${cw}x${ch} at ${cx},${cy}`);
}
