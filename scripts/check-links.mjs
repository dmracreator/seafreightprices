#!/usr/bin/env node
/**
 * Internal link and asset checker.
 *
 * Walks every .html file in the repo and verifies that each local
 * href/src resolves to a file that exists, that every same-page
 * fragment (#section) has a matching id, and that each page carries
 * the metadata search engines need.
 *
 * Run locally with:  node scripts/check-links.mjs
 * Exits non-zero on the first category of failure, so CI blocks the
 * deploy rather than shipping a broken link.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".git", ".github", "scripts"]);

/** Every .html file in the repo. */
function htmlFiles(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (extname(name) === ".html") out.push(full);
  }
  return out;
}

/** Resolve a site-root or relative URL to a path on disk. */
function toDisk(url, fromFile) {
  const clean = url.split("#")[0].split("?")[0];
  if (!clean) return null;
  let p = clean.startsWith("/")
    ? join(ROOT, clean)
    : resolve(dirname(fromFile), clean);
  if (clean.endsWith("/")) p = join(p, "index.html");
  else if (!extname(p)) p = join(p, "index.html");
  return p;
}

const files = htmlFiles();
const errors = [];
const warnings = [];

for (const file of files) {
  const rel = file.slice(ROOT.length + 1);
  const html = readFileSync(file, "utf8");

  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

  for (const url of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(url)) continue;

    // Same-page fragment, including the SPA's hash routes on the home page.
    if (url.startsWith("#")) {
      const frag = url.slice(1);
      if (!frag || frag.startsWith("/")) continue; // "#" or hash route
      if (!ids.has(frag)) errors.push(`${rel} → missing id "#${frag}"`);
      continue;
    }

    // Link into the single-page app, e.g. /#/rates
    if (url.startsWith("/#")) {
      if (!existsSync(join(ROOT, "index.html"))) errors.push(`${rel} → no index.html for ${url}`);
      continue;
    }

    const disk = toDisk(url, file);
    if (disk && !existsSync(disk)) {
      errors.push(`${rel} → broken link ${url}  (expected ${disk.slice(ROOT.length + 1)})`);
    }
  }

  // Metadata every page needs to be indexable and shareable.
  const need = [
    [/<title>[^<]{10,}<\/title>/, "a <title>"],
    [/<meta name="description" content="[^"]{50,}"/, "a meta description of 50+ characters"],
    [/<link rel="canonical" href="https:\/\//, "a canonical URL"],
    [/<meta property="og:image"/, "an og:image"],
    [/<html lang="/, "a lang attribute"],
    [/<h1[ >]/, "an <h1>"],
  ];
  for (const [re, what] of need) {
    if (!re.test(html)) warnings.push(`${rel} → missing ${what}`);
  }
  const h1s = (html.match(/<h1[ >]/g) || []).length;
  if (h1s > 1) warnings.push(`${rel} → ${h1s} <h1> elements, expected 1`);
}

// Every URL in the sitemap must exist, and every page should be listed.
const sitemapPath = join(ROOT, "sitemap.xml");
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const loc of locs) {
    const path = loc.replace(/^https?:\/\/[^/]+/, "");
    const disk = toDisk(path, join(ROOT, "index.html"));
    if (disk && !existsSync(disk)) errors.push(`sitemap.xml → ${loc} does not exist`);
  }
  const listed = new Set(locs.map((l) => l.replace(/^https?:\/\/[^/]+/, "")));
  for (const file of files) {
    const rel = "/" + file.slice(ROOT.length + 1).replace(/index\.html$/, "");
    if (rel === "/404.html") continue;
    if (!listed.has(rel)) warnings.push(`sitemap.xml → does not list ${rel}`);
  }
} else {
  errors.push("sitemap.xml is missing");
}

console.log(`Checked ${files.length} HTML files.`);
for (const w of warnings) console.log(`  warning: ${w}`);
for (const e of errors) console.error(`  ERROR:   ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). Deploy blocked.`);
  process.exit(1);
}
console.log(warnings.length ? `\n${warnings.length} warning(s), no errors.` : "\nAll links and metadata OK.");
