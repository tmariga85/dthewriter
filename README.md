# dthewriter.co.za

Static site for **D the Writer** — Daisy Mariga, South African freelance copywriter,
ghostwriter and publisher. Served by GitHub Pages at <https://www.dthewriter.co.za/>.

Migrated from WordPress on Afrihost shared hosting. The original site was a
single-page WordPress install with a bespoke theme (`d-2023`), no plugins and no
media-library uploads, so the markup, CSS, JavaScript and images here are the
same files the WordPress theme was serving — the design is unchanged.

## Layout

```
index.html                     the whole site (single page, anchor navigation)
assets/css/                    theme stylesheets
assets/js/                     theme scripts + mailto-contact.js
assets/images/                 photography, book cover, logos
assets/vendors/                GSAP, Flickity, Isotope, jQuery, Bootstrap, etc.
tools/banner/                  the three supplied banner artworks + the script that clears their text
CNAME                          custom domain for GitHub Pages
```

## Contact forms

GitHub Pages serves static files only, so the WordPress theme's PHP mailer
(`assets/php/mailer.php`) is gone. Both forms — the one in the Contact section
and the one in the pop-up modal — are handled by
[`assets/js/mailto-contact.js`](assets/js/mailto-contact.js): on submit it
validates the fields, composes a formatted message and opens the visitor's own
email application addressed to **deethewriter85@gmail.com**.

The page also carries WhatsApp links to **+27 67 182 0542** (`https://wa.me/27671820542`)
in the menu overlay, the contact modal and the footer icons.

To change the recipient, edit `RECIPIENT` at the top of that file. With
JavaScript disabled the forms fall back to a plain `mailto:` POST to the same
address.

## Floating WhatsApp button

Both pages carry a WhatsApp button fixed to the bottom-right corner, styled by
[`assets/css/whatsapp-float.css`](assets/css/whatsapp-float.css). The number and the opening
message live in the `href` on each page, not in the stylesheet, so the two pages open with
different wording against the same number (+27 67 182 0542).

Its `z-index` is 900, chosen to sit above the theme side rail (10) and the Elevating Spaces
sticky header (50) while staying below the contact modal (999), so the modal still covers it.
On a pointer device it reveals a "Chat with us" label on hover; on touch that label is hidden,
since there is no hover to reveal it with.

## Books carousel

The `#books` section replaced the theme's interior-design demo section. Covers live
in `assets/images/books/`, the markup is five `.lqd-book-slide` blocks in
`index.html`, and the behaviour is [`assets/js/books-carousel.js`](assets/js/books-carousel.js)
(Flickity, already bundled with the theme, plus a coverflow tilt) styled by
[`assets/css/books.css`](assets/css/books.css).

To add a book: drop the cover in `assets/images/books/`, copy a slide block and
change the image, title, subtitle and the `https://www.amazon.com/dp/<ASIN>` link.

## Editing

It's one HTML file — edit `index.html` and push. GitHub Pages redeploys on every
push to `main`, usually within a minute.

## DNS

Domain and email stay with Afrihost. Only the web records point here:

| Record | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| CNAME | `www` | `tmariga85.github.io` |

Mail (`MX`) and `SPF` records are untouched, so email keeps running on Afrihost.

## Elevating Spaces page

`elevating-spaces.html` is a standalone page for the Elevating Spaces brand, with its own
stylesheet at `assets/css/elevating-spaces.css`. It is linked from both menus on the landing
page and listed in the sitemap.

Images live in `assets/images/elevating/`. The gift box photographs were resized from the
originals in `D:\Website- Elevating Spaces\`; the four canvas artworks were rendered from the
supplied PDFs (see below).

| File | Used for |
|---|---|
| `hero-1.jpg` `hero-2.jpg` `hero-3.jpg` | The three banners &mdash; the supplied 1774&times;887 artworks with their baked-in wording painted out (see below) |
| `hero-gift-box.jpg` | Superseded by the banners; kept only as a fallback crop, nothing links to it |
| `teacher-thoughtful.jpg` | The Thoughtful Gift |
| `teacher-appreciation.jpg` | The Appreciation Gift |
| `teacher-signature.jpg` | The Signature Gift |
| `corporate-appreciation.jpg` | The Appreciation Box |
| `corporate-signature.jpg` | The Signature Box |
| `christmas-box.jpg` | Christmas Collection |
| `canvas-seeds.jpg` | We Are Seeds |
| `canvas-pebbles.jpg` | Pebbles of Yesterday |
| `canvas-gentle.jpg` | Let Our Hearts Be Gentle |
| `canvas-dad.jpg` | Dad, You Are The Man |
| `home-living.jpg` | Styled living room &mdash; low resolution, see below |
| `home-pantry.jpg` | Organised pantry &mdash; low resolution, see below |

A missing file falls back to a styled placeholder naming what belongs there, so further
photography can be dropped in later with no markup change.

The home services section sits beside the Christmas Collection in a two-column row, with two
interior photographs above its copy.

**Those two photographs are low resolution.** They were cropped out of a composite mock-up of
the section rather than supplied as files, so each is about 210x132 native, upscaled to 460px
wide. They hold up at the size they display but will look soft on a high-density screen.
Replace `home-living.jpg` and `home-pantry.jpg` with the originals when they are available.

The four canvases run as a carousel ([`assets/js/canvas-carousel.js`](assets/js/canvas-carousel.js)):
the centred canvas is scaled up while its neighbours shrink, tilt away and fade. It is
hand-rolled rather than taken from a library, because the two failures that matter here are
the ones libraries tend to have — autoplay that never restarts after an interaction, and
clicks swallowed when a finger moves a few pixels. The slides are tripled so the run loops
continuously, snapping back by one set with the transition off once it leaves the middle copy.
A press within 12px counts as a click: on a side canvas it centres it, on the centred one it
opens that canvas's enquiry.

### Banner carousel and closing band

**The banner is three supplied artworks on a rotation.** Each arrived at 1774&times;887 with
its heading, rule, paragraph and button printed into the picture. Baked-in text cannot
reflow, cannot be selected or translated, and turns to mush on a phone, so it is painted
out of every one and set live over the space it left. The artworks and the script that
clears them live in `tools/banner/`, which also documents the method and the one number
that tells you a clearing rectangle has gone too far.

The three differ in where their copy belongs, because the product is on a different side in
each: banner 1 puts it on the right, banners 2 and 3 on the left. Banner 3 also carries a
four-category row — Corporate Gifts, Home &amp; Lifestyle, Wellness &amp; Self-Care, Special
Occasions — drawn as live SVG icons rather than lifted from the picture. Banners 2 and 3
set their second heading line in green (`.es-h-green`); banner 1 is all brown. Live type
colours were sampled off the artworks: headings `#5a3b1c` and `#6b3e11` / `#37520d`, rules
`#ac913a`, `#8f8a4a` and `#cba75e`, and the button `#3a5009`, now `--es-cta`.

The slides share a single CSS grid cell (`grid-area: 1 / 1`) and cross-fade, so the hero
never changes height as it rotates. The copy on each is sized in `vw` so the type keeps
pace with the picture rather than drifting out of proportion as the window changes. Two
things to know before touching the sizes:

- **`height: auto` on each banner `<img>` is load-bearing.** The `width`/`height`
  attributes are presentational hints, so without it `height: 887px` beats `aspect-ratio`
  and the banner comes out too tall.
- **Playfair sets wider than the face in the artwork**, so banners 2 and 3 take a slightly
  smaller heading than banner 1 to keep their second line on one line and clear of the
  gift box. The box's left edge slants, so the usable width shrinks as the copy goes down;
  `tools/banner/README.md` lists where it falls on each.

The rotation is in the page's own script: a 7-second cross-fade that stops on hover, on
focus, when the tab is hidden, and when the visitor asks for reduced motion. There are dots
and a pause button, arrow-key support, and swipe for the stacked layout. Below 860px each
banner stacks — the artwork crops to its own product side (`object-position` per slide) and
the copy moves onto the wash below it, where it has the full width to reflow.

The closing band is unchanged: a slim cream strip, branch at the left, copy centred, button
at the right-hand end, with a 90px left padding on the copy so it reads as centred on the
band rather than on the space the button leaves.

The band's foliage is a `<symbol id="es-branch">` near the top of the page, placed with
`<use>` and turned by the `.es-foliage-*` rules. Drawing it once keeps every sprig
identical; changing the leaf shape in that one `<g id="es-leaf">` changes all of them. The
banner no longer uses it — the artwork carries its own leaves.

One fix fell out of this work: `.es-page a { color: inherit }` is a class plus a type, so it
outranked the plain `.es-btn`, and every button on the page had been rendering its label in
ink rather than white. The button rule now also matches `a.es-btn`, which settles it on
source order.

Buttons are set in a system sans (`--es-sans`), not Lora — the cues show them that way.

The brand mark in the header and footer is the real Elevating Spaces logo — a roof with a
chimney over an olive branch — redrawn as SVG from the artwork printed on the supplied
banner image. It is landscape (120×70), not the portrait sprout it replaced. The roof takes
`currentColor` and the leaves read `--es-logo-green` / `--es-logo-green-dark`, which is how
the footer lightens the whole mark against the olive background; `--es-logo-halo` is the
thin outline that keeps overlapping leaves apart and is set to whatever sits behind it.

### Rendering the canvas PDFs

The canvas artwork arrived as print PDFs. pdf.js in Node renders the photograph but not the
embedded fonts, so the quotes were read from the PDF text layer and drawn back on at the
recorded positions. The working scripts are not kept in this repository; the approach was:

1. `pdfjs-dist` with a single canvas factory for both the page canvas and its scratch
   canvases — mixing `canvas` and `@napi-rs/canvas` fails inside `endGroup` with
   "Image or Canvas expected".
2. `page.getTextContent()` for each line's string, baseline position, size and advance
   width, and `getOperatorList()` for the fill colours (white quote, gold strapline).
3. Each line drawn in Georgia italic with node-canvas, scaled horizontally to the exact
   width the PDF recorded, so the line breaks and extents match the original.

Two notes on the source files:

- `Website Elevating Spaces- Dance Canvas.pdf` is 8MB of zero bytes and contains no PDF
  data at all, so that canvas is not on the page.
- The other four PDFs store their photographs as CMYK, two as `DCTDecode` and two as
  `FlateDecode` with a PNG predictor. Converting those by hand gives the wrong colours;
  letting pdf.js do the decoding is what gets them right.

Every call to action opens a mail client addressed to deethewriter85@gmail.com with a subject
and prefilled checklist for that collection. The footer carries Contact, Instagram (handle
still to be supplied) and WhatsApp on +27 67 182 0542.
