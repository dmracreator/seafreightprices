#!/usr/bin/env python3
"""
Regenerates the static Insights pages for SeaFreightPrices.com.

Optional. The generated HTML in insights/ is committed and can be edited
by hand — this script exists so that a change to the shared article
chrome (header, footer, breadcrumbs, schema, related-reads) can be
applied across every article at once instead of ten times.

Reads scripts/content/articles.json for metadata and one fragment per
article from scripts/content/fragments/<slug>.html, each carrying a TOC
block, an FAQ block and a BODY block. Writes insights/<slug>/index.html,
the hub at insights/index.html, and sitemap.xml.

    python3 scripts/build-insights.py

House style for the fragments is in scripts/content/STYLE-GUIDE.md.
"""
import json, os, re, sys, html
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
FRAG = os.path.join(HERE, "content", "fragments")
SITE = "https://www.seafreightprices.com"

# ---------------------------------------------------------------- articles
ARTICLES = json.load(open(os.path.join(HERE, "content", "articles.json"), encoding="utf-8"))
BY_SLUG = {a["slug"]: a for a in ARTICLES}

AUTHORS = {
    "market": ("SeaFreightPrices Market Desk", "MD",
               "The market desk validates every rate submission, maintains the corridor indices and writes the weekly Freight Pulse briefing."),
    "research": ("SeaFreightPrices Research", "SR",
                 "The research team covers regulation, capacity and contract structure, and maintains the methodology behind every published benchmark."),
}

# ---------------------------------------------------------------- chrome
def header(active=""):
    def cl(name):
        return ' class="active"' if name == active else ""
    return f"""<a class="skip" href="#main">Skip to content</a>

<header class="site" id="siteHeader">
  <div class="wrap nav">
    <a class="logo" href="/">seafreight<b>prices</b><span class="dotcom">.com</span></a>
    <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks"><span></span></button>
    <nav class="nav-links" id="navLinks" aria-label="Primary">
      <a href="/#/rates">Rates &amp; lanes</a>
      <a href="/#/pulse">Freight Pulse</a>
      <a href="/#/ports">Port Watch</a>
      <a href="/#/outlook">Rate Outlook</a>
      <a href="/insights/"{cl('insights')}>Insights</a>
      <a href="/#/methodology">Methodology</a>
    </nav>
    <div class="nav-tools">
      <a class="btn btn-navy btn-sm" href="/#/access">Get access</a>
    </div>
  </div>
</header>"""


FOOTER = """<footer class="site">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="logo" href="/">seafreight<b>prices</b><span class="dotcom">.com</span></a>
        <p class="foot-blurb">Independent freight market intelligence — rates, trade lanes, congestion and analysis in one platform built for forwarders.</p>
        <p style="margin-top:14px;font-size:.86rem"><a href="mailto:info@seafreightprices.com">info@seafreightprices.com</a></p>
      </div>
      <div class="foot-col">
        <h2>Data</h2>
        <a href="/#/rates">Rates &amp; trade lanes</a>
        <a href="/#/ports">Port Watch</a>
        <a href="/#/outlook">Rate Outlook</a>
        <a href="/#/methodology">Methodology</a>
      </div>
      <div class="foot-col">
        <h2>Products</h2>
        <a href="/#/pulse">Freight Pulse</a>
        <a href="/insights/">Insights</a>
        <a href="/#/access">Access &amp; pricing</a>
        <a href="/#/access">API &amp; data feeds</a>
      </div>
      <div class="foot-col">
        <h2>Company</h2>
        <a href="/#/contact">Contact</a>
        <a href="/#/contact">Become a contributor</a>
        <a href="/#/methodology">Independence policy</a>
        <a href="/#/contact">Privacy</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© 2026 SeaFreightPrices.com — all rates indicative unless contractually confirmed.</span>
      <span class="eco-note"><i aria-hidden="true"></i> Part of the <a href="https://containerbooking.com" rel="noopener">ContainerBooking.com</a> ecosystem</span>
    </div>
  </div>
</footer>"""


def head(title, desc, url, og_type="website", extra="", image="/assets/img/og-default.png"):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0F2244">
<link rel="canonical" href="{url}">
<meta property="og:site_name" content="SeaFreightPrices.com">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="{og_type}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}{image}">
<meta property="og:locale" content="en">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{SITE}{image}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
{extra}</head>
<body>
"""


# ---------------------------------------------------------------- fragments
def parse_fragment(slug):
    path = os.path.join(FRAG, slug + ".html")
    if not os.path.exists(path):
        return None
    raw = open(path, encoding="utf-8").read()

    def block(name):
        m = re.search(r"<!--%s-->(.*?)<!--/%s-->" % (name, name), raw, re.S)
        if not m:
            raise SystemExit(f"{slug}: missing {name} block")
        return m.group(1).strip()

    toc = json.loads(block("TOC"))
    faq = json.loads(block("FAQ"))
    body = block("BODY")
    return toc, faq, body


# ---------------------------------------------------------------- article page
def build_article(a):
    parsed = parse_fragment(a["slug"])
    if not parsed:
        print("  skip (no fragment):", a["slug"])
        return False
    toc, faq, body = parsed

    url = f"{SITE}/insights/{a['slug']}/"
    author_name, initials, author_bio = AUTHORS[a.get("author", "market")]
    seo_title = a.get("seoTitle", a["title"]) + " | SeaFreightPrices.com"
    desc = a["metaDescription"]

    graph = [
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Insights", "item": SITE + "/insights/"},
                {"@type": "ListItem", "position": 3, "name": a["title"]},
            ],
        },
        {
            # Dated market reporting is a NewsArticle; evergreen guidance is an Article.
            "@type": "NewsArticle" if a.get("type") == "news" else "Article",
            "headline": a["title"][:110],
            "description": desc,
            "datePublished": a["date"],
            "dateModified": a.get("modified", a["date"]),
            "inLanguage": "en",
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "url": url,
            "articleSection": a["cat"],
            "keywords": ", ".join(a["keywords"]),
            "wordCount": len(re.sub(r"<[^>]+>", " ", body).split()),
            "image": SITE + "/assets/img/og-default.png",
            "author": {"@type": "Organization", "name": author_name, "url": SITE + "/#/methodology"},
            "publisher": {
                "@type": "Organization",
                "name": "SeaFreightPrices.com",
                "url": SITE + "/",
                "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/logo.png"},
            },
        },
    ]
    if a.get("type") == "news" and a.get("sources"):
        graph[-1]["citation"] = [{"@type": "CreativeWork", "name": s} for s in a["sources"]]
    if faq:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": f["q"],
                 "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", f["a"])}}
                for f in faq
            ],
        })

    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, indent=2, ensure_ascii=False)
    extra = f'<script type="application/ld+json">\n{ld}\n</script>\n'

    toc_html = "\n".join(
        f'      <li><a href="#{t["id"]}">{t["label"]}</a></li>' for t in toc
    )

    faq_html = ""
    if faq:
        items = "\n".join(
            f"""      <details>
        <summary>{f['q']}</summary>
        <div>{f['a']}</div>
      </details>"""
            for f in faq
        )
        faq_html = f"""
    <section class="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Frequently asked questions</h2>
{items}
    </section>
"""

    # Dated reporting carries a visible as-of line and a source list, so a
    # reader arriving months later can see immediately how fresh it is.
    is_news = a.get("type") == "news"
    dateline = ""
    if is_news and a.get("asOf"):
        dateline = f"""
        <p class="asof"><strong>Market data as of {a['asOf']}.</strong>
        Rates move weekly. For the current position on your own lanes, use the
        <a href="/#/rates">rate explorer</a>.</p>
"""
    sources_note = ""
    if is_news and a.get("sources"):
        items = "".join(f"<li>{s}</li>" for s in a["sources"])
        sources_note = f"""
          <div class="sources">
            <h2>Sources</h2>
            <ul>{items}</ul>
            <p>Figures are as published by the named third parties on the dates given.
            They are not SeaFreightPrices benchmarks; our own methodology is set out
            on the <a href="/#/methodology">methodology page</a>.</p>
          </div>
"""

    # three related reads: same category first, then most recent
    others = [x for x in ARTICLES if x["slug"] != a["slug"]]
    others.sort(key=lambda x: (x["cat"] != a["cat"], x["date"]), reverse=False)
    same = [x for x in others if x["cat"] == a["cat"]]
    rest = [x for x in others if x["cat"] != a["cat"]]
    rest.sort(key=lambda x: x["date"], reverse=True)
    related = (same + rest)[:3]

    rel_html = "\n".join(
        f"""        <a class="post" href="/insights/{r['slug']}/">
          <span class="thumb"><img src="/assets/img/insights/{r['slug']}.svg" alt="" loading="lazy" decoding="async" width="640" height="400"></span>
          <span class="body">
            <span class="meta"><span>{r['cat']}</span><span aria-hidden="true">·</span><span>{r['shown']}</span></span>
            <span class="h3">{r['title']}</span>
            <span class="dek">{r['dek']}</span>
            <span class="go">Read analysis <span aria-hidden="true">→</span></span>
          </span>
        </a>"""
        for r in related
    )

    page = head(seo_title, desc, url, "article", extra) + f"""{header('insights')}

<main id="main">
<article>

  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/insights/">Insights</a></li>
        <li><span aria-current="page">{a['cat']}</span></li>
      </ol>
    </nav>

    <header class="art-head">
      <span class="pill">{a['cat']}</span>
      <h1>{a['title']}</h1>
      <p class="dek">{a['dek']}</p>
      <div class="art-meta">
        <span class="who">{author_name}</span>
        <span aria-hidden="true">·</span>
        <time datetime="{a['date']}">{a['shown']}</time>
        <span aria-hidden="true">·</span>
        <span>{a['mins']} min read</span>
      </div>
    </header>

    <div class="art-layout">
      <div class="prose">
{dateline}
{body}
{faq_html}
        <footer class="art-foot">
{sources_note}
          <div class="author">
            <span class="av" aria-hidden="true">{initials}</span>
            <div>
              <strong>{author_name}</strong>
              <p>{author_bio}</p>
            </div>
          </div>
        </footer>
      </div>

      <nav class="toc" id="toc" aria-labelledby="toc-heading">
        <h2 id="toc-heading">On this page</h2>
        <ol>
{toc_html}
        </ol>
      </nav>
    </div>
  </div>

</article>

<aside class="next-up" aria-labelledby="next-heading">
  <div class="wrap">
    <div class="sec-head" style="margin-bottom:26px">
      <span class="eyebrow">Keep reading</span>
      <h2 id="next-heading" style="font-size:1.7rem">Related analysis.</h2>
    </div>
    <div class="grid g3">
{rel_html}
    </div>
  </div>
</aside>
</main>

{FOOTER}
<script src="/assets/js/article.js" defer></script>
</body>
</html>
"""
    out = os.path.join(ROOT, "insights", a["slug"])
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    print(f"  ✓ {a['slug']:<44} {words:>5} words  {len(toc)} sections  {len(faq)} FAQs")
    return True


# ---------------------------------------------------------------- hub page
def build_hub():
    url = SITE + "/insights/"
    # The newest piece gets the hero card, but it stays in the list below as
    # well — otherwise a category filter would silently hide it.
    feat = ARTICLES[0]
    rest = ARTICLES

    graph = [
        {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": "Insights"},
            ],
        },
        {
            "@type": "CollectionPage",
            "@id": url,
            "url": url,
            "name": "Insights — freight market analysis",
            "description": "Guides and analysis on container rates, surcharges, port congestion, capacity and ocean freight contracts, written for freight forwarders.",
            "inLanguage": "en",
            "isPartOf": {"@type": "WebSite", "url": SITE + "/", "name": "SeaFreightPrices.com"},
            "hasPart": [
                {"@type": "Article", "headline": a["title"], "url": f"{SITE}/insights/{a['slug']}/",
                 "datePublished": a["date"], "description": a["metaDescription"]}
                for a in ARTICLES
            ],
        },
    ]
    extra = '<script type="application/ld+json">\n%s\n</script>\n' % json.dumps(
        {"@context": "https://schema.org", "@graph": graph}, indent=2, ensure_ascii=False)

    cats = []
    for a in ARTICLES:
        if a["cat"] not in cats:
            cats.append(a["cat"])
    chips = "\n".join(
        f'        <button type="button" data-cat="{c}">{c}</button>' for c in cats)

    rows = "\n".join(
        f"""      <a class="hub-row" href="/insights/{a['slug']}/" data-cat="{a['cat']}">
        <span class="hub-when"><time datetime="{a['date']}">{a['shown']}</time></span>
        <span>
          <span class="hub-title">{a['title']}</span>
          <span class="hub-dek">{a['dek']}</span>
        </span>
        <span class="hub-cat">{a['cat']} · {a['mins']} min</span>
      </a>"""
        for a in rest
    )

    page = head(
        "Insights — freight market analysis for forwarders | SeaFreightPrices.com",
        "Practical guides and analysis on container rates, shipping surcharges, port congestion, blank sailings and ocean freight contracts — written for freight forwarders.",
        url, "website", extra) + f"""{header('insights')}

<main id="main">

  <section class="hub-hero">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb" style="padding-top:0;padding-bottom:22px">
        <ol>
          <li><a href="/">Home</a></li>
          <li><span aria-current="page">Insights</span></li>
        </ol>
      </nav>
      <div class="hub-lead">
        <div>
          <span class="eyebrow">Insights</span>
          <h1 style="font-size:clamp(2.1rem,4.4vw,3.2rem);margin:16px 0 18px">Analysis for people who price freight.</h1>
          <p class="lede">Guides to how ocean freight is actually priced — surcharges, contracts, capacity and congestion — alongside analysis of what the market is doing right now. Written by the desk that maintains the benchmarks.</p>
        </div>
        <div class="card">
          <h2 style="font-size:1rem">Get it weekly</h2>
          <p style="font-size:.89rem;color:var(--muted);margin-top:8px">Freight Pulse lands every Tuesday at 07:00 CET: what moved on your lanes, which ports are tightening, and what it means for the quotes on your desk.</p>
          <a class="btn btn-primary btn-sm" href="/#/pulse" style="margin-top:18px">Read this week's issue</a>
        </div>
      </div>
    </div>
  </section>

  <section class="section tight" style="padding-top:26px">
    <div class="wrap">
      <h2 class="sr">Featured analysis</h2>
      <a class="featured" href="/insights/{feat['slug']}/">
        <span class="art"><img src="/assets/img/insights/{feat['slug']}.svg" alt="" width="640" height="400"></span>
        <span class="txt">
          <span class="meta" style="font-size:.72rem;font-family:var(--mono);color:var(--faint)">{feat['cat']} · <time datetime="{feat['date']}">{feat['shown']}</time> · {feat['mins']} min read</span>
          <h2>{feat['title']}</h2>
          <span class="dek">{feat['dek']}</span>
          <span class="go" style="font-size:.85rem;font-weight:600;color:var(--blue-600)">Read analysis <span aria-hidden="true">→</span></span>
        </span>
      </a>
    </div>
  </section>

  <section class="section" style="padding-top:40px">
    <div class="wrap">
      <h2 class="sr">All articles</h2>
      <div class="hub-filters region-chips" id="hubFilters" style="margin-bottom:0">
        <button type="button" data-cat="" class="on">All</button>
{chips}
        <span class="hub-count" id="hubCount"></span>
      </div>

      <div class="hub-list" id="hubList">
{rows}
      </div>

      <p style="font-size:.82rem;color:var(--faint);margin-top:30px">
        Every article is written by the SeaFreightPrices market desk and reviewed against the
        <a href="/#/methodology" style="color:var(--blue-600)">published methodology</a>.
        Figures used as illustrations are labelled as such.
      </p>
    </div>
  </section>

  <section class="section tight">
    <div class="wrap">
      <div class="eco">
        <div class="txt">
          <b>Need to actually move the box?</b>
          <p>SeaFreightPrices.com stays an information platform. When a lane turns into a shipment, ContainerBooking.com handles the booking, customs and tracking side.</p>
        </div>
        <a class="btn btn-eco" href="https://containerbooking.com" rel="noopener">Go to ContainerBooking.com <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>

</main>

{FOOTER}
<script src="/assets/js/insights.js" defer></script>
</body>
</html>
"""
    open(os.path.join(ROOT, "insights", "index.html"), "w", encoding="utf-8").write(page)
    print("  ✓ insights/index.html")


# ---------------------------------------------------------------- sitemap
def build_sitemap():
    today = "2026-09-01"
    urls = [(SITE + "/", today, "daily", "1.0"),
            (SITE + "/insights/", today, "weekly", "0.9")]
    for a in ARTICLES:
        urls.append((f"{SITE}/insights/{a['slug']}/", a.get("modified", a["date"]), "monthly", "0.8"))
    body = "\n".join(
        f"""  <url>
    <loc>{u}</loc>
    <lastmod>{m}</lastmod>
    <changefreq>{c}</changefreq>
    <priority>{p}</priority>
  </url>""" for u, m, c, p in urls)
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{body}
</urlset>
"""
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)
    print(f"  ✓ sitemap.xml ({len(urls)} URLs)")


if __name__ == "__main__":
    print("Building insights…")
    built = sum(build_article(a) for a in ARTICLES)
    build_hub()
    build_sitemap()
    print(f"Done — {built}/{len(ARTICLES)} articles.")
