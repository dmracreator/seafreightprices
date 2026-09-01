# SeaFreightPrices.com

Independent freight market intelligence — container rate benchmarks, trade-lane
analytics, port congestion data and market analysis, built for freight
forwarders.

The companion brand to [ContainerBooking.com](https://containerbooking.com).
ContainerBooking is the operational platform: bookings, customs, tracking.
SeaFreightPrices is the information layer, and it has to stay credible for
someone who never becomes a forwarding customer. That constraint drives most of
the decisions in this repo.

---

## Contents

- [Quick start](#quick-start)
- [How the site is put together](#how-the-site-is-put-together)
- [Repository layout](#repository-layout)
- [Design system](#design-system)
- [Publishing an article](#publishing-an-article)
- [Connecting real data](#connecting-real-data)
- [SEO](#seo)
- [Accessibility](#accessibility)
- [Deployment](#deployment)
- [Before going live](#before-going-live)

---

## Quick start

No build step, no dependencies. Serve the folder over HTTP:

```bash
git clone git@github.com:YOUR-ORG/seafreightprices.com.git
cd seafreightprices.com
python3 -m http.server 8000
# open http://localhost:8000
```

Use a server rather than opening `index.html` from the filesystem — the site
uses root-relative paths (`/assets/...`), which do not resolve over `file://`.

Run the checks CI runs:

```bash
node --check assets/js/app.js
node scripts/check-links.mjs
```

`check-links.mjs` walks every HTML file and fails the build on a broken
internal link, a missing anchor target, or a page missing its title, meta
description, canonical URL, `og:image`, `lang` attribute or `<h1>`.

---

## How the site is put together

Two different jobs, deliberately handled two different ways.

**The data products** — rate explorer, Freight Pulse, Port Watch, Rate Outlook,
methodology, pricing, contact — live in `index.html` as a small hash-routed
single-page app (`/#/rates`, `/#/ports`, and so on). These are interactive
tools. Nobody arrives at them from a search engine, and they benefit from
sharing one loaded dataset and one set of chart code.

**The editorial content** lives at real URLs: `/insights/` and
`/insights/<slug>/`. Each article is a complete, static, crawlable HTML file
with its own title, meta description, canonical URL, Open Graph tags and
`Article` + `FAQPage` structured data. This is the half that has to rank, so it
is not hidden behind a hash route or rendered by JavaScript.

Everything degrades without JavaScript. Article text, the Insights index, all
navigation and all internal links are in the HTML. Scripts add the rate
explorer, the filters, the charts and the command palette on top.

---

## Repository layout

```
.
├── index.html                  Single-page app: rates, Pulse, ports, outlook,
│                               methodology, access, contact
├── insights/
│   ├── index.html              Article hub — crawlable list of everything
│   └── <slug>/index.html       One static page per article (10 of them)
├── assets/
│   ├── css/styles.css          The entire design system, one file
│   ├── js/
│   │   ├── data.js             window.SFP — lanes, ports, indices, articles
│   │   ├── app.js              SPA: router, charts, explorer, command palette
│   │   ├── insights.js         Hub category filtering
│   │   └── article.js          Table-of-contents scrollspy, mobile menu
│   └── img/                    Icons, logo, Open Graph card
├── scripts/
│   ├── check-links.mjs         Internal link + metadata checker (runs in CI)
│   ├── build-insights.py       Optional: regenerate all article pages
│   └── content/
│       ├── STYLE-GUIDE.md      House style for Insights articles
│       ├── articles.json       Article metadata (titles, SEO, dates)
│       └── fragments/          Article bodies, one per slug
├── .github/workflows/deploy.yml GitHub Pages build and deploy
├── 404.html                    Styled not-found page with useful routes
├── sitemap.xml                 All 12 indexable URLs
├── robots.txt                  Crawl rules, including AI answer engines
├── site.webmanifest            PWA manifest
├── favicon.svg                 Scalable favicon
├── CNAME                       www.seafreightprices.com
└── .nojekyll                   Serve the repo as-is, no Jekyll processing
```

---

## Design system

Shared with ContainerBooking.com: the same navy and ivory foundation, the same
type scale, the same component shapes. The difference is the accent.
ContainerBooking uses orange. **SeaFreightPrices uses blue as the information
accent** — orange appears only on links out to the ContainerBooking ecosystem,
so the two brands read as related without reading as the same product.

All tokens are CSS custom properties at the top of `assets/css/styles.css`:

| Token | Value | Used for |
| --- | --- | --- |
| `--navy-800` | `#0F2244` | Primary surface, headings |
| `--ivory` | `#F7F5F0` | Page background |
| `--blue` | `#2F7DD6` | Information accent, charts, links |
| `--rise` | `#C63C50` | Rate increase (a cost rise for the reader) |
| `--fall` | `#12885F` | Rate decrease |
| `--orange` | `#F96302` | ContainerBooking.com links only |

Typography is Inter for text and IBM Plex Mono for every figure, with
`font-variant-numeric: tabular-nums` set globally so columns of numbers line
up. Rate movements use red for a rise and green for a fall — from a forwarder's
side of the desk, a rising rate is the bad news.

---

## Publishing an article

Two ways in. Both end with the same committed HTML.

**By hand.** Copy an existing `insights/<slug>/index.html` and replace the
content. The structure is deliberately repetitive, so nothing needs to be
learned first. Then update the `Article` JSON-LD in the head (`headline`,
`description`, `datePublished`, `dateModified`, `articleSection`, `keywords`,
`wordCount`), add the article to `insights/index.html`, to the `ARTICLES` array
in `assets/js/data.js`, and to `sitemap.xml`.

**With the generator**, which handles all of that except `data.js`:

1. Add the metadata to `scripts/content/articles.json`.
2. Write the body to `scripts/content/fragments/<slug>.html` — three
   comment-delimited blocks (`TOC`, `FAQ`, `BODY`), as
   [`scripts/content/STYLE-GUIDE.md`](scripts/content/STYLE-GUIDE.md) sets out.
3. Run `python3 scripts/build-insights.py`.
4. Add the same entry to `ARTICLES` in `assets/js/data.js` so the home page
   teaser and the command palette pick it up.

The generator also exists so that a change to the shared article chrome —
header, breadcrumbs, schema, related reads — can be applied to all ten articles
at once rather than ten times.

Either way, run `node scripts/check-links.mjs` before committing.

House style, briefly: British English; written practitioner-to-practitioner; no
invented statistics; worked examples labelled as illustrative; a key takeaways
box at the top that answers the question on its own; and an FAQ block whose
answers stand up without the surrounding article, because those are what gets
pulled into search results and AI answers. The full guide is in
`scripts/content/STYLE-GUIDE.md`.

---

## Connecting real data

Everything in `assets/js/data.js` is sample data, generated deterministically
from a fixed seed so the site renders identically on every load. Nothing is
fetched at runtime.

To wire up live feeds, replace the arrays — or the whole module — keeping these
shapes:

```js
LANES:    { id, o, oc, d, dc, corridor, rate, transit, contrib, wk, mo, series[52] }
PORTS:    [ name, countryCode, region, berthWaitDays, yardUtilPct, weekChangeDays ]
INDICES:  [ name, value, weeklyChangePct ]
ARTICLES: { slug, title, cat, date, shown, mins, dek }
```

`series` is 52 weekly observations, oldest first. `app.js` derives the high,
low, average, volatility and percentile position from it, so nothing else needs
to change.

Every figure on the site is currently labelled as sample data. **Remove those
labels only when the feeds behind them are real** — the independence claim on
the methodology page is the most valuable thing this brand owns.

---

## SEO

- One indexable URL per article, no hash routes in the editorial section.
- Unique title, meta description, canonical and Open Graph tags per page.
- `Article`, `BreadcrumbList` and `FAQPage` structured data on every article;
  `Organization` and `WebSite` on the home page; `CollectionPage` on the hub.
- Exactly one `<h1>` per page. Inside the SPA, only the home view carries it —
  the other views open with `<h2 class="route-h1">` at the same visual size.
- `sitemap.xml` and `robots.txt` are in sync with what actually exists, and CI
  fails if they drift.
- `robots.txt` opens `/insights/` to AI answer engines and keeps `/api/` closed.
- Articles are written to answer a real question rather than to hit a keyword
  density. The FAQ blocks exist because they are the surface that rich results
  and AI answers read from.

---

## Accessibility

Targeting WCAG 2.1 AA.

- Semantic landmarks throughout: `header`, `nav`, `main`, `article`, `aside`,
  `footer`, each labelled where more than one of a kind appears.
- Skip link to `#main` on every page.
- Heading levels descend without gaps; no heading is used for styling alone.
- Visible `:focus-visible` outlines on every interactive element, with a
  lighter variant on dark surfaces.
- Data tables use `<caption>`, `scope="col"` and `scope="row"`.
- Body text meets AA contrast against both the ivory and navy surfaces.
- The command palette is fully keyboard-driven: `⌘K` / `Ctrl-K` to open, arrow
  keys to move, Enter to go, Escape to close.
- `prefers-reduced-motion: reduce` disables the ticker animation, card
  transitions and smooth scrolling.
- Decorative marks carry `aria-hidden="true"`; nothing is communicated by
  colour alone — rate movements carry a sign as well as a colour.
- A print stylesheet drops the chrome and expands link URLs.

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which checks that
the JavaScript parses, runs the link checker, and publishes the repository root
to GitHub Pages.

One-time setup:

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Pages → Custom domain:** `www.seafreightprices.com`
   (this repo already contains the matching `CNAME`).
3. At your DNS provider, point `www` at `YOUR-ORG.github.io` with a `CNAME`
   record, and redirect the apex domain to `www`.
4. Tick **Enforce HTTPS** once the certificate has been issued.

`.nojekyll` is present so GitHub serves the files exactly as committed.

---

## Before going live

- [ ] Replace the sample data in `assets/js/data.js` with real feeds, or keep
      every "sample data" label in place.
- [ ] Regenerate `assets/img/` from the real brand assets — the current icons,
      logo and Open Graph card are generated placeholders and do not use the
      brand typeface.
- [ ] Point the contact and access forms at a real endpoint. They currently
      compose a `mailto:` message, which is honest but not a CRM.
- [ ] Add real privacy and cookie policy pages; the footer links are
      placeholders.
- [ ] Confirm the author attribution on articles matches how the desk actually
      wants to be credited.
- [ ] Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- [ ] Re-run Lighthouse against the deployed URL, not `localhost`.

---

© 2026 SeaFreightPrices.com. See [LICENSE](LICENSE).
