/*!
 * SeaFreightPrices.com — Insights hub
 * ---------------------------------------------------------------
 * Client-side category filtering over server-rendered rows. Every
 * article is in the HTML and crawlable; this only hides rows the
 * reader has filtered out, and announces the result count.
 */
(function () {
  "use strict";

  /* ---------------------------------------------------------- menu */
  var burger = document.getElementById("burger");
  var header = document.getElementById("siteHeader");
  if (burger && header) {
    burger.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  /* -------------------------------------------------------- filter */
  var filters = document.getElementById("hubFilters");
  var list = document.getElementById("hubList");
  var count = document.getElementById("hubCount");
  if (!filters || !list) return;

  var rows = [].slice.call(list.querySelectorAll(".hub-row"));
  var buttons = [].slice.call(filters.querySelectorAll("button[data-cat]"));

  if (count) {
    count.setAttribute("role", "status");
    count.setAttribute("aria-live", "polite");
  }

  function apply(cat, announce) {
    var shown = 0;
    rows.forEach(function (row) {
      var match = !cat || row.dataset.cat === cat;
      row.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach(function (b) {
      var on = b.dataset.cat === cat;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (count && announce) {
      count.textContent = shown + (shown === 1 ? " article" : " articles");
    }

    // Keep the URL shareable without adding history entries per click.
    try {
      var url = cat ? "?category=" + encodeURIComponent(cat) : location.pathname;
      history.replaceState(null, "", url);
    } catch (e) { /* file:// and some privacy modes disallow this */ }
  }

  filters.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cat]");
    if (!b) return;
    apply(b.dataset.cat, true);
  });

  // Honour ?category= on load so a filtered view can be linked to.
  var initial = "";
  try {
    initial = new URLSearchParams(location.search).get("category") || "";
  } catch (e) { /* no URLSearchParams: fall through to "all" */ }
  var known = buttons.some(function (b) { return b.dataset.cat === initial; });
  apply(known ? initial : "", false);
  if (count) count.textContent = rows.filter(function (r) { return !r.hidden; }).length + " articles";
})();
