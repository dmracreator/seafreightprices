# Publishing prompts

Ready-to-paste prompts for producing new Insights content. Two cadences:
**weekly market news** (dated reporting) and **monthly evergreen guides** (the
pages that rank).

## Before you paste

1. Start a new Claude session and connect the folder containing this repo.
2. Replace `<REPO>` in the prompt with the folder name you connected, or just
   delete the line if the session is already pointed at the repo root.
3. Paste one of the prompts below as your first message.

Everything the prompt needs is in the repo: the house style guide, the article
metadata, the generator and the checks. You should not need to explain the site.

---

## Prompt 1 — Weekly market news

Run this once a week. Produces 2–3 dated pieces of 700–950 words each.

```
You are writing this week's market news for SeaFreightPrices.com, an
independent freight market intelligence site. The reader is a freight
forwarder or a shipper's logistics lead. Repo: <REPO>.

READ FIRST, IN FULL — do not skip these:
- README.md (the "Publishing an article" and "Evergreen guides vs market
  news" sections)
- scripts/content/STYLE-GUIDE.md (house style and the fragment format)
- scripts/content/articles.json (what already exists — do not repeat an angle)
- one existing news fragment, for shape:
  scripts/content/fragments/panama-canal-transit-slots-cut-september-2026.html

STEP 1 — RESEARCH. Do this before writing a single sentence.
Search the web for container shipping and ocean freight news published in the
last 7 days. Cover at minimum:
  - the Drewry World Container Index weekly assessment (composite plus the
    named port pairs) and any other index prints you can find
  - market coverage from FreightWaves, The Loadstar, Journal of Commerce,
    Freightos, Alphaliner, Linerlytica, Sea-Intelligence
  - carrier announcements: GRIs, PSS, FAK levels, blank sailing programmes,
    service changes
  - port congestion, weather, labour action, canal restrictions (Suez, Panama)
  - regulation with a freight cost impact: EU ETS, FuelEU, IMO, tariffs, customs
Open the actual articles with a fetch. Do NOT write from search snippets alone
— snippets drop dates, garble numbers and misattribute sources. For every
figure you intend to publish, record the publisher and the publication date.
Where two sources disagree, note both rather than picking one.

STEP 2 — CHOOSE. Pick the 2–3 stories that change what a forwarder does next
week. Ignore anything that only matters to carriers or investors. List your
picks in one line each with the source date, then keep going without waiting
for me.

STEP 3 — WRITE. One fragment per story at
scripts/content/fragments/<slug>.html, following the exact three-block format
in STYLE-GUIDE.md (TOC / FAQ / BODY). For news pieces:
  - 700–950 words in the BODY
  - 5–6 H2 sections, key takeaways box at the top, 4–5 FAQs
  - attribute every number in the prose to the organisation that published it,
    by name and with the date: "Drewry assessed Shanghai to Rotterdam down 5%
    at $4,092 per 40ft on 3 September"
  - 3–5 internal links to existing articles or app routes, none external
  - slugs are descriptive and dated where useful, e.g.
    panama-canal-transit-slots-cut-september-2026

STEP 4 — WIRE IT UP.
  a) Add each article to the TOP of scripts/content/articles.json with:
     slug, title, seoTitle, metaDescription (140–200 chars), keywords[],
     "cat": "Market news", "type": "news", date (ISO), shown (e.g.
     "8 September 2026"), asOf, mins, author ("market" or "research"),
     dek, and sources[] — one line per source, naming publisher and date.
  b) Add the same entries to the TOP of the ARTICLES array in
     assets/js/data.js (slug, title, cat, date, shown, mins, dek only).
     This drives the home page teasers and the command palette. It is the
     step that gets forgotten.
  c) Run: python3 scripts/build-insights.py
     This regenerates the article pages, the hub and sitemap.xml.

STEP 5 — VERIFY. Run all of these and fix anything they report:
  node scripts/check-links.mjs
  node --check assets/js/data.js
Then re-read each published page and confirm: exactly one <h1>, the "market
data as of" line is present, the sources block lists every publication you
cited, and every figure in the prose traces back to something you actually
fetched.

STEP 6 — REPORT BACK with: the stories you chose and why, word counts, the
sources used, and anything you found but deliberately left out.

NON-NEGOTIABLE:
- Never invent a statistic, a study, a quote or a source. If you cannot verify
  a number, leave it out or say plainly that reports differ.
- Never present a third-party figure as a SeaFreightPrices benchmark. The
  site's own rate data is sample data; do not cite it as market fact and do
  not reconcile it against real published levels.
- No external links in the prose. Name sources in text; the sources block at
  the foot carries the full attribution.
- British English. No exclamation marks. Check your draft against the banned
  phrase list in STYLE-GUIDE.md before you finish.
- If the week genuinely had no story worth a forwarder's attention, write one
  piece instead of three and tell me. Do not pad.
```

---

## Prompt 2 — Monthly evergreen guide

Run this once a month. Produces one ~1,500-word guide built to rank for years.

```
You are writing one evergreen guide for SeaFreightPrices.com, an independent
freight market intelligence site. The reader is a freight forwarder or a
shipper's logistics lead who arrived from a search engine with a specific
question. Repo: <REPO>.

READ FIRST, IN FULL:
- scripts/content/STYLE-GUIDE.md (house style and the fragment format)
- scripts/content/articles.json (every existing article and its keywords)
- one existing evergreen fragment, for shape:
  scripts/content/fragments/container-shipping-surcharges-explained.html

STEP 1 — PICK THE TOPIC.
Look at what the site already covers and find the gap. Search the web to
sanity-check that people are actually asking the question, and to see what the
current top results cover — then plan to cover it better, not to copy it.
Prefer topics where a forwarder gets a genuinely useful answer nowhere else:
mechanics, arithmetic, worked examples, and what to actually do.
Candidate directions if nothing better emerges: demurrage and detention and
how to negotiate free time; Incoterms and who pays which charge; bill of
lading types and when each is used; customs and AEO status; dangerous goods
documentation; how to read a schedule reliability report; equipment
availability and repositioning; NVOCC versus carrier contracts; what a
forwarder should do when cargo is rolled.
Tell me your pick and the primary keyword in two lines, then keep going.

STEP 2 — WRITE. One fragment at scripts/content/fragments/<slug>.html in the
three-block format (TOC / FAQ / BODY):
  - 1,100–1,500 words in the BODY
  - 6–8 H2 sections, key takeaways box at the top, 5 FAQs
  - at least one table or worked example, figures clearly labelled illustrative
  - 3–5 internal links to existing articles or app routes, none external
  - primary keyword in the first 100 words and in one H2, used naturally

STEP 3 — WIRE IT UP.
  a) Add the article to scripts/content/articles.json in date order with:
     slug, title, seoTitle, metaDescription, keywords[], cat (Guides,
     Methodology, Ports, Contracts, Analysis, Capacity, Regulation or
     Commodities — NOT "Market news"), date, shown, mins, author, dek.
     Do not set "type": "news" — evergreen guides use Article schema.
  b) Add the same entry to the ARTICLES array in assets/js/data.js.
  c) Run: python3 scripts/build-insights.py

STEP 4 — VERIFY:
  node scripts/check-links.mjs
  node --check assets/js/data.js
Then re-read the page: one <h1>, TOC anchors all resolve, tables have a
caption and scope attributes, no banned phrases.

STEP 5 — REPORT BACK with the topic, the keyword, the word count and the
internal links you added.

NON-NEGOTIABLE:
- Never invent a statistic, a study, a survey result or a named source.
- Any figure used to illustrate must be labelled illustrative in the caption
  or the surrounding sentence.
- Structural facts stated plainly are fine (how a BAF is calculated, what an
  MQC is). Anything time-sensitive should be framed as something the reader
  verifies for their own lane and date.
- British English, practitioner-to-practitioner, no marketing voice.
```

---

## Prompt 3 — One-off article on a topic you choose

For when you have a specific subject in mind.

```
Write one article for SeaFreightPrices.com on: <TOPIC>.
Repo: <REPO>.

Follow scripts/content/STYLE-GUIDE.md exactly. Decide first whether this is
dated market news (700–950 words, "Market news" category, "type": "news",
sources block, every figure attributed to a named publisher with a date) or an
evergreen guide (1,100–1,500 words, an existing evergreen category, Article
schema) — tell me which and why in one line, then write it.

If it needs current facts, research the web and fetch the actual sources
before writing. Never invent a figure.

Then: add it to scripts/content/articles.json AND to the ARTICLES array in
assets/js/data.js, run python3 scripts/build-insights.py, and verify with
node scripts/check-links.mjs and node --check assets/js/data.js.
```

---

## What "done" looks like

After any of the above, the repo should be in this state:

- a new fragment in `scripts/content/fragments/`
- a matching entry in `scripts/content/articles.json`
- a matching entry in the `ARTICLES` array in `assets/js/data.js`
- generated pages under `insights/<slug>/`, a rebuilt `insights/index.html`
  and an updated `sitemap.xml`
- `node scripts/check-links.mjs` reporting no errors and no warnings

Then commit and push. The GitHub Actions workflow runs the same checks and
deploys to Pages.

## The four failure modes worth watching for

1. **Writing from search snippets.** Snippets lose dates, round numbers and
   attach them to the wrong publisher. The prompts insist on fetching the
   source; check that it actually happened.
2. **Forgetting `data.js`.** The generator does not touch it, so the article
   publishes correctly but never appears in the home page teasers or the
   command palette.
3. **Confident invention.** If a figure looks unusually specific and no
   publisher is named next to it in the prose, ask where it came from.
4. **Sample data leaking into news.** The rate explorer is still demo data.
   News pieces must cite Drewry, Freightos and others by name and must never
   present the site's own numbers as market fact — until the real feed is
   wired up.

## Reviewing before you publish

Read the key takeaways box on its own. If someone who read only those four
bullets would leave knowing the answer, the piece works. If the bullets tease
rather than tell, send it back.
