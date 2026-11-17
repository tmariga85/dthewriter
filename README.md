# dthewriter.co.za

Static site for **D the Writer** — Daisy Maiga, South African freelance copywriter,
ghostwriter and publisher. Served by GitHub Pages at <https://dthewriter.co.za/>.

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
| CNAME | `www` | `tmariga85.github.io` (redirects to the bare domain) |

Mail (`MX`) and `SPF` records are untouched, so email keeps running on Afrihost.
