# Banner artwork

`banner-1-supplied.webp`, `banner-2-supplied.webp` and `banner-3-supplied.webp` are the three
hero banners exactly as they were supplied: 1774&times;887 each, with the heading, rule,
paragraph, category row and button printed into the picture.

`inpaint-banner.mjs` paints that wording out and writes `hero-1.jpg`, `hero-2.jpg` and
`hero-3.jpg` into `assets/images/elevating/`, which is what the page uses. The page then
sets the same words as live HTML over the cleared space, so they reflow, can be selected
and translated, and stay readable on a phone.

It needs `sharp`:

```bash
npm i sharp && node tools/banner/inpaint-banner.mjs
```

## How the clearing works

The fill is harmonic (Laplace): each rectangle is replaced by a surface whose boundary ring
equals the real pixels, so it meets the photograph exactly &mdash; no seam, no feathered
rectangle, no guessing at a background colour. It is solved on a quarter-resolution grid,
then refined at full size. Rectangles are applied in order and each sees the result of the
last, so a tall block of copy can be cleared in bands.

The rectangles at the top of the script are tight on purpose, because each has to thread
between the text it is clearing and the photography around it:

| Banner | What boxes it in |
|---|---|
| 1 | Leaves at both right corners end at y 128 and resume at y 688; the button ends at x 1688 and the lower leaf starts at x 1717 |
| 2 | The gift box's left edge slants from x 717 at the top to x 601 at the foot, so the rectangles narrow as they go down; leaves top-left end at y 170 and bottom-left start at y 690 |
| 3 | The olive box sits from x 790, the candle glass from x 767, and a eucalyptus sprig cuts in at x 671 below y 620 |

The script prints the darkest pixel it found on every boundary ring. **If one comes back
dark (below about 170) that rectangle has caught real content and will smear it inwards** —
pull the bound back until the number is light. That one number is the whole quality check.

If a new banner is supplied, add it to the `BANNERS` array, set its rectangles from where
its copy sits, and re-run.
