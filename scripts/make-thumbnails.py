#!/usr/bin/env python3
"""
Generates the article illustrations used on card thumbnails, the Insights
featured panel and the related-reads block.

One SVG per article slug, written to assets/img/insights/<slug>.svg.

These are not decoration for its own sake. Each one draws the mechanism the
article explains — a percentile band, a queue of waiting vessels, a staircase
of rate increases — in the site's navy and blue system. Vector, so they stay
crisp at any size, and about two kilobytes each.

    python3 scripts/make-thumbnails.py

Two conventions worth keeping if you add one:
  - use fill-opacity / stroke-opacity rather than the `opacity` attribute,
    which some renderers apply inconsistently to whole shapes;
  - no text. The 640x400 canvas is cropped hard into a 132px-tall card, so
    any label ends up illegible.

Adding an article: write a motif function, key it by slug in MOTIFS, re-run.
A slug with no motif falls back to a generic plotted line.
"""
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
OUT = os.path.join(ROOT, "assets", "img", "insights")

W, H = 640, 400
NAVY_A, NAVY_B = "#0F2244", "#1E4079"
WHITE, BLUE, DEEP = "#FFFFFF", "#7FB0E6", "#2F7DD6"
DIM = "#5C82B8"

# Solid tints rather than fill-opacity. Partial opacity on a <rect> is applied
# inconsistently by some SVG rasterisers, so every shade below is a real colour
# mixed against the navy background — identical in every renderer.
T1, T2, T3 = "#BFD6F0", "#8FB3DC", "#41699F"   # light to dark on navy
PANEL, CELL = "#1B3961", "#26456F"             # subtle surfaces


# ---------------------------------------------------------------- frame
def svg(slug, motif):
    """Wrap a motif in the shared gradient background and dot texture."""
    u = sum(ord(c) * (i + 3) for i, c in enumerate(slug)) % 9973
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="b{u}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{NAVY_A}"/>
      <stop offset="100%" stop-color="{NAVY_B}"/>
    </linearGradient>
    <pattern id="d{u}" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="#FFFFFF" fill-opacity="0.13"/>
    </pattern>
    <linearGradient id="f{u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{DEEP}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="{DEEP}" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="url(#b{u})"/>
  <rect width="{W}" height="{H}" fill="url(#d{u})"/>
{motif.replace("FILLGRAD", f"url(#f{u})")}
</svg>
"""


def path(points, close_to=None):
    d = "".join(("M" if i == 0 else "L") + f"{x:.1f} {y:.1f} " for i, (x, y) in enumerate(points))
    if close_to is not None:
        d += f"L{points[-1][0]:.1f} {close_to} L{points[0][0]:.1f} {close_to} Z"
    return d.strip()


def wobble(seed, n, amp):
    """Deterministic small offsets, so a chart line does not look ruled."""
    s, out = seed, []
    for _ in range(n):
        s = (s * 1103515245 + 12345) % 2147483648
        out.append((s / 2147483648 - 0.5) * 2 * amp)
    return out


def series(seed, n, lo, hi):
    s, out, v = seed, [], 0.5
    for _ in range(n):
        s = (s * 1103515245 + 12345) % 2147483648
        v = max(0.08, min(0.92, v + (s / 2147483648 - 0.5) * 0.34))
        out.append(hi - v * (hi - lo))
    return out


# ---------------------------------------------------------------- motifs
# SAFE BAND. These images are placed with object-fit: cover into boxes of very
# different shapes — a 2.9:1 card thumbnail and a roughly 1.9:1 featured panel.
# Cover always preserves the full width here and crops the height, and the
# tightest crop keeps only y 89–311 of the 400px canvas. So every element that
# carries meaning lives inside y 96–304. Anything outside that band is bleed.
SAFE_TOP, SAFE_BOT = 96, 304


def m_index():
    """Rate index: a plotted line inside a shaded percentile band."""
    xs = [70 + i * 50 for i in range(11)]
    ys = series(7, 11, 152, 250)
    hi = path(list(zip(xs, [y - 32 for y in ys])))
    lo = "".join(f"L{x:.1f} {y + 32:.1f} " for x, y in reversed(list(zip(xs, ys))))
    return f"""  <path d="{hi} {lo}Z" fill="#2C5285"/>
  <path d="{path(list(zip(xs, ys)))}" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="{xs[-1]}" cy="{ys[-1]:.1f}" r="10" fill="{WHITE}"/>
  <line x1="50" y1="298" x2="590" y2="298" stroke="{DIM}" stroke-width="2"/>"""


def m_surcharges():
    """Surcharges: base freight, then the layers stacked on top of it."""
    out, y = [], 104
    for i, w in enumerate([340, 214, 152, 106, 70]):
        out.append(f'  <rect x="96" y="{y}" width="{w}" height="30" rx="7" fill="{[WHITE, T1, BLUE, T2, T3][i]}"/>')
        y += 40
    out.append(f'  <line x1="96" y1="300" x2="520" y2="300" stroke="{DIM}" stroke-width="2"/>')
    return "\n".join(out)


def m_fcl_lcl():
    """FCL vs LCL: one box packed solid, one carrying part of a load."""
    out = [f'  <rect x="66" y="118" width="222" height="164" rx="10" fill="none" stroke="{WHITE}" stroke-width="3.5"/>']
    for r in range(4):
        for c in range(5):
            out.append(f'  <rect x="{81 + c * 41}" y="{132 + r * 38}" width="34" height="31" rx="4" fill="{BLUE}"/>')
    out.append(f'  <rect x="352" y="118" width="222" height="164" rx="10" fill="none" stroke="{WHITE}" stroke-width="3.5"/>')
    filled = {(0, 0), (0, 1), (1, 0), (1, 2), (2, 1), (3, 3)}
    for r in range(4):
        for c in range(5):
            out.append(f'  <rect x="{367 + c * 41}" y="{132 + r * 38}" width="34" height="31" rx="4" '
                       f'fill="{BLUE if (r, c) in filled else CELL}"/>')
    return "\n".join(out)


def m_congestion():
    """Port congestion: every berth taken, and a queue building offshore."""
    out = []
    for i in range(10):
        x, y = 104 + (i % 5) * 108, 116 if i < 5 else 158
        out.append(f'  <circle cx="{x}" cy="{y}" r="12" fill="{[WHITE, WHITE, T1, T1, T2, T2, T2, T3, T3, T3][i]}"/>')
    out.append(f'  <rect x="60" y="284" width="520" height="15" rx="7.5" fill="{WHITE}"/>')
    for i in range(5):
        out.append(f'  <rect x="{78 + i * 104}" y="228" width="78" height="46" rx="6" fill="{BLUE if i < 4 else T3}"/>')
    return "\n".join(out)


def m_contract():
    """Contract: clauses on a page, with the one that matters marked."""
    out = [f'  <rect x="152" y="100" width="300" height="204" rx="12" fill="{PANEL}" stroke="{T3}" stroke-width="2.5"/>']
    for i, w in enumerate([176, 226, 206, 240, 156, 232]):
        y = 126 + i * 28
        key = i == 3
        out.append(f'  <rect x="184" y="{y}" width="{w}" height="11" rx="5.5" fill="{BLUE if key else T2}"/>')
        if key:
            out.append(f'  <rect x="162" y="{y - 7}" width="6" height="25" rx="3" fill="{BLUE}"/>')
    return "\n".join(out)


def m_floor():
    """Rate floor: a decline that flattens onto a hard line underneath."""
    xs = [70 + i * 52 for i in range(10)]
    wob = wobble(23, 10, 7)
    ys = [276 - 132 * math.exp(-i / 2.9) + wob[i] for i in range(10)]
    return f"""  <path d="{path(list(zip(xs, ys)), close_to=294)}" fill="FILLGRAD"/>
  <path d="{path(list(zip(xs, ys)))}" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="50" y1="294" x2="590" y2="294" stroke="{BLUE}" stroke-width="4.5" stroke-dasharray="15 11" stroke-linecap="round"/>
  <circle cx="{xs[-1]}" cy="{ys[-1]:.1f}" r="9" fill="{WHITE}"/>"""


def m_blank():
    """Blank sailings: a weekly cadence with departures withdrawn."""
    out = []
    blanked = {2, 5, 6, 9}
    for i in range(11):
        x = 62 + i * 52
        if i in blanked:
            out.append(f'  <rect x="{x}" y="150" width="35" height="86" rx="6" fill="none" stroke="{DIM}" stroke-width="2.5" stroke-dasharray="7 6"/>')
            out.append(f'  <path d="M{x + 9} 178 L{x + 26} 210 M{x + 26} 178 L{x + 9} 210" stroke="{DIM}" stroke-width="3" stroke-linecap="round"/>')
        else:
            out.append(f'  <rect x="{x}" y="150" width="35" height="86" rx="6" fill="{BLUE}"/>')
    out.append(f'  <line x1="50" y1="264" x2="590" y2="264" stroke="{WHITE}" stroke-width="2.5" stroke-opacity="0.85"/>')
    return "\n".join(out)


def m_carbon():
    """Carbon: emissions against a limit that steps down over time."""
    out = []
    steps = [148, 148, 172, 172, 196, 196, 220, 220]
    heights = [110, 126, 100, 140, 116, 132, 106, 122]
    for i, h in enumerate(heights):
        over = (296 - h) < steps[i]
        out.append(f'  <rect x="{76 + i * 62}" y="{296 - h}" width="40" height="{h}" rx="5" fill="{BLUE if over else T3}"/>')
    pts = []
    for i, lim in enumerate(steps):
        pts += [(68 + i * 62, lim), (68 + (i + 1) * 62, lim)]
    out.append(f'  <path d="{path(pts)}" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linejoin="round"/>')
    out.append(f'  <line x1="60" y1="296" x2="586" y2="296" stroke="{DIM}" stroke-width="2"/>')
    return "\n".join(out)


def m_reefer():
    """Reefer: a temperature trace held inside the box, plugged in."""
    pts = [(96 + i * 20, 192 + math.sin(i / 1.9) * 30) for i in range(23)]
    out = [f'  <rect x="72" y="112" width="496" height="160" rx="12" fill="none" stroke="{WHITE}" stroke-width="3.5"/>',
           f'  <line x1="96" y1="192" x2="544" y2="192" stroke="{WHITE}" stroke-width="2" stroke-dasharray="8 8" stroke-opacity="0.45"/>',
           f'  <path d="{path(pts)}" fill="none" stroke="{BLUE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>']
    for i in range(4):
        x = 132 + i * 126
        out.append(f'  <line x1="{x}" y1="272" x2="{x}" y2="290" stroke="{WHITE}" stroke-width="2.5" stroke-opacity="0.45"/>')
        out.append(f'  <circle cx="{x}" cy="297" r="8" fill="{T1}"/>')
    return "\n".join(out)


def m_cape():
    """Routing: the short way and the long way, same two endpoints."""
    return f"""  <path d="M96 196 Q320 118 544 196" fill="none" stroke="{DIM}" stroke-width="3.5" stroke-dasharray="13 10"/>
  <path d="M96 196 Q320 372 544 196" fill="none" stroke="{WHITE}" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M250 268 q70 34 140 0 q-70 46 -140 0 Z" fill="#2C5285"/>
  <circle cx="96" cy="196" r="13" fill="{WHITE}"/>
  <circle cx="544" cy="196" r="13" fill="{WHITE}"/>
  <circle cx="320" cy="278" r="8" fill="{BLUE}"/>"""


def m_divergence():
    """Divergence: one starting point, two directions."""
    up = [(96 + i * 56, 208 - i * 8 - (i * i) * 0.55) for i in range(9)]
    dn = [(96 + i * 56, 208 + i * 7 + (i * i) * 0.42) for i in range(9)]
    return f"""  <line x1="96" y1="208" x2="590" y2="208" stroke="{DIM}" stroke-width="2" stroke-dasharray="8 8"/>
  <path d="{path(up)}" fill="none" stroke="{WHITE}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="{path(dn)}" fill="none" stroke="{BLUE}" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="96" cy="208" r="11" fill="{WHITE}"/>
  <circle cx="{up[-1][0]}" cy="{up[-1][1]:.1f}" r="10" fill="{WHITE}"/>
  <circle cx="{dn[-1][0]}" cy="{dn[-1][1]:.1f}" r="10" fill="{BLUE}"/>"""


def m_canal():
    """Canal: daily transit slots, a third of them withdrawn."""
    out = [f'  <line x1="64" y1="136" x2="576" y2="136" stroke="{WHITE}" stroke-width="4"/>',
           f'  <line x1="64" y1="246" x2="576" y2="246" stroke="{WHITE}" stroke-width="4"/>']
    for i in range(9):
        x = 88 + i * 54
        if i < 6:
            out.append(f'  <rect x="{x}" y="162" width="38" height="58" rx="5" fill="{BLUE}"/>')
        else:
            out.append(f'  <rect x="{x}" y="162" width="38" height="58" rx="5" fill="none" stroke="{DIM}" stroke-width="2.5" stroke-dasharray="6 5"/>')
            out.append(f'  <path d="M{x + 10} 180 L{x + 28} 202 M{x + 28} 180 L{x + 10} 202" stroke="{DIM}" stroke-width="2.5" stroke-linecap="round"/>')
    out.append(f'  <line x1="64" y1="290" x2="410" y2="290" stroke="{BLUE}" stroke-width="5" stroke-linecap="round"/>')
    out.append(f'  <line x1="418" y1="290" x2="576" y2="290" stroke="{T3}" stroke-width="5" stroke-linecap="round"/>')
    return "\n".join(out)


def m_staircase():
    """Repeated increases: each one stepped up, each partly given back."""
    pts, x, y = [(62, 292)], 62, 292
    for _ in range(7):
        y -= 24
        pts.append((x, y))
        x += 40
        pts.append((x, y))
        y += 8
        pts.append((x, y))
        x += 34
        pts.append((x, y))
    return f"""  <path d="{path(pts, close_to=298)}" fill="FILLGRAD"/>
  <path d="{path(pts)}" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="50" y1="298" x2="590" y2="298" stroke="{DIM}" stroke-width="2"/>
  <circle cx="{pts[-1][0]}" cy="{pts[-1][1]}" r="10" fill="{BLUE}"/>"""


def m_default():
    xs = [70 + i * 52 for i in range(10)]
    ys = series(3, 10, 140, 270)
    return f"""  <path d="{path(list(zip(xs, ys)), close_to=298)}" fill="FILLGRAD"/>
  <path d="{path(list(zip(xs, ys)))}" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="50" y1="298" x2="590" y2="298" stroke="{DIM}" stroke-width="2"/>"""


MOTIFS = {
    "how-to-read-a-container-freight-rate-index": m_index,
    "container-shipping-surcharges-explained": m_surcharges,
    "fcl-vs-lcl": m_fcl_lcl,
    "how-to-predict-port-congestion": m_congestion,
    "ocean-freight-contract-negotiation": m_contract,
    "asia-europe-container-rates": m_floor,
    "blank-sailings-explained": m_blank,
    "eu-ets-fueleu-freight-surcharges": m_carbon,
    "reefer-container-rates": m_reefer,
    "cape-of-good-hope-routing-cost": m_cape,
    "transpacific-asia-europe-rate-divergence-september-2026": m_divergence,
    "panama-canal-transit-slots-cut-september-2026": m_canal,
    "seventeen-gri-transpacific-2026": m_staircase,
}


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    articles = json.load(open(os.path.join(HERE, "content", "articles.json"), encoding="utf-8"))
    for a in articles:
        slug = a["slug"]
        motif = MOTIFS.get(slug, m_default)
        open(os.path.join(OUT, slug + ".svg"), "w", encoding="utf-8").write(svg(slug, motif()))
        print(f"  ✓ {slug}.svg" + ("" if slug in MOTIFS else "   (generic fallback)"))
    print(f"{len(articles)} illustrations in assets/img/insights/")
