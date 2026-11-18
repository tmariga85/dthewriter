/*
 * Clears the baked-in wording out of the supplied hero artwork.
 *
 * Each banner arrived from the designer with its heading, rule, paragraph and
 * button printed into the picture. Baked-in text cannot reflow, cannot be
 * selected or translated, and turns to mush on a phone, so the page sets that
 * copy as live HTML instead — which means the picture underneath has to be
 * cleared first.
 *
 * The fill is harmonic (Laplace): each rectangle is replaced by a surface
 * whose boundary ring equals the real pixels, so it meets the photograph
 * exactly. No seam, no feathered patch, no guessing at a background colour.
 * It is solved on a quarter-resolution grid, then refined at full size.
 *
 *   npm i sharp && node tools/banner/inpaint-banner.mjs
 *
 * The rectangles are tight on purpose: each has to thread between the text it
 * is clearing and the leaves, gift box and other photography around it. The
 * script prints the darkest pixel found on every boundary ring — if one comes
 * back dark, that rectangle has caught real content and will smear it inwards,
 * so pull the bound back until the number is light (above ~170).
 */

import sharp from 'sharp';

const here = new URL('./', import.meta.url).pathname.slice(1);
const out = new URL('../../assets/images/elevating/', import.meta.url).pathname.slice(1);

// [x0, y0, x1, y1, label] — inclusive, in the 1774x887 artwork's own pixels.
const BANNERS = [
  { src: 'banner-1-supplied.webp', dest: 'hero-1.jpg', rects: [
    [1032, 138, 1706, 676, 'all copy'],
  ] },
  { src: 'banner-2-supplied.webp', dest: 'hero-2.jpg', rects: [
    [  34, 170,  700, 352, 'heading'],
    [ 240, 362,  480, 388, 'rule'],
    [  60, 398,  660, 580, 'paragraph'],
    [  50, 596,  610, 684, 'button'],
  ] },
  { src: 'banner-3-supplied.webp', dest: 'hero-3.jpg', rects: [
    [ 120, 136,  710, 228, 'head line 1'],
    [  60, 230,  790, 325, 'head line 2'],
    [ 270, 338,  540, 364, 'rule'],
    [  60, 374,  760, 520, 'icon row'],
    [ 100, 545,  678, 650, 'paragraph'],
    [ 110, 655,  668, 755, 'button'],
  ] },
];

// Jacobi sweeps with the border pinned to the real pixels.
function solve(w, h, b, iters) {
  const f = new Float64Array(b.seed);
  for (let it = 0; it < iters; it++) {
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        f[i] = .25 * (f[i - 1] + f[i + 1] + f[i - w] + f[i + w]);
      }
    for (let x = 0; x < w; x++) { f[x] = b.top[x]; f[(h - 1) * w + x] = b.bot[x]; }
    for (let y = 0; y < h; y++) { f[y * w] = b.left[y]; f[y * w + w - 1] = b.right[y]; }
  }
  return f;
}

for (const banner of BANNERS) {
  console.log(banner.src);
  const { data, info } = await sharp(here + banner.src).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const px = (x, y, c) => data[(y * W + x) * C + c];
  const lum = (x, y) => px(x, y, 0) * .3 + px(x, y, 1) * .59 + px(x, y, 2) * .11;

  for (const [X0, Y0, X1, Y1, label] of banner.rects) {
    let worst = 999, where = '';
    const look = (x, y) => { const l = lum(x, y); if (l < worst) { worst = l; where = x + ',' + y; } };
    for (let x = X0 - 1; x <= X1 + 1; x++) { look(x, Y0 - 1); look(x, Y1 + 1); }
    for (let y = Y0; y <= Y1; y++) { look(X0 - 1, y); look(X1 + 1, y); }
    console.log(`  ${label.padEnd(12)} x ${X0}-${X1} y ${Y0}-${Y1}   darkest ring px ${worst.toFixed(0)} at ${where}` +
                (worst < 170 ? '   <-- TOO DARK, pull this rectangle back' : ''));

    const PW = X1 - X0 + 1, PH = Y1 - Y0 + 1;
    const patch = Buffer.alloc(PW * PH * 3);
    for (let c = 0; c < 3; c++) {
      const S = 4, cw = Math.ceil(PW / S), ch = Math.ceil(PH / S);
      const gx = i => Math.min(X1, X0 + i * S), gy = j => Math.min(Y1, Y0 + j * S);
      const b = {
        top: new Float64Array(cw), bot: new Float64Array(cw),
        left: new Float64Array(ch), right: new Float64Array(ch), seed: new Float64Array(cw * ch),
      };
      for (let i = 0; i < cw; i++) { b.top[i] = px(gx(i), Y0 - 1, c); b.bot[i] = px(gx(i), Y1 + 1, c); }
      for (let j = 0; j < ch; j++) { b.left[j] = px(X0 - 1, gy(j), c); b.right[j] = px(X1 + 1, gy(j), c); }
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++)
        b.seed[j * cw + i] = b.left[j] + (b.right[j] - b.left[j]) * (i / Math.max(1, cw - 1));
      const coarse = solve(cw, ch, b, 4000);

      const fine = new Float64Array(PW * PH);
      for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
        const u = x / S, v = y / S;
        const i0 = Math.min(cw - 1, Math.floor(u)), j0 = Math.min(ch - 1, Math.floor(v));
        const i1 = Math.min(cw - 1, i0 + 1), j1 = Math.min(ch - 1, j0 + 1);
        const fu = u - i0, fv = v - j0;
        const a = coarse[j0 * cw + i0] * (1 - fu) + coarse[j0 * cw + i1] * fu;
        const d = coarse[j1 * cw + i0] * (1 - fu) + coarse[j1 * cw + i1] * fu;
        fine[y * PW + x] = a * (1 - fv) + d * fv;
      }
      const fb = {
        top: new Float64Array(PW), bot: new Float64Array(PW),
        left: new Float64Array(PH), right: new Float64Array(PH), seed: fine,
      };
      for (let x = 0; x < PW; x++) { fb.top[x] = px(X0 + x, Y0 - 1, c); fb.bot[x] = px(X0 + x, Y1 + 1, c); }
      for (let y = 0; y < PH; y++) { fb.left[y] = px(X0 - 1, Y0 + y, c); fb.right[y] = px(X1 + 1, Y0 + y, c); }
      const full = solve(PW, PH, fb, 120);
      for (let i = 0; i < PW * PH; i++) patch[i * 3 + c] = Math.max(0, Math.min(255, Math.round(full[i])));
    }
    // Write the patch back so later rectangles on the same banner see it.
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const di = ((Y0 + y) * W + (X0 + x)) * C, si = (y * PW + x) * 3;
      data[di] = patch[si]; data[di + 1] = patch[si + 1]; data[di + 2] = patch[si + 2];
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: C } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out + banner.dest);
  console.log('  -> assets/images/elevating/' + banner.dest);
}
