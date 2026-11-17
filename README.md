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
| `hero-gift-box.jpg` | Hero photograph (right-hand crop of the main banner) |
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

A missing file falls back to a styled placeholder naming what belongs there, so further
photography can be dropped in later with no markup change.

The home services section lists the four services instead of illustrating them: none of the
supplied photography shows a finished room, and every gift box shot fills its frame, so there
is nothing to crop a room vignette from. If photographs of completed decluttering, organising
or styling work arrive, that section can go back to images.

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
