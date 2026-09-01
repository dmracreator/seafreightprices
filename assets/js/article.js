/*!
 * SeaFreightPrices.com — article page enhancements
 * ---------------------------------------------------------------
 * Purely additive. The article is fully readable and navigable
 * with this file blocked: the table of contents is real anchor
 * markup, the FAQ is native <details>, and the menu button only
 * exists to collapse a nav that is otherwise always visible.
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

  /* ------------------------------------------- table of contents */
  var toc = document.getElementById("toc");
  if (!toc) return;

  var links = [].slice.call(toc.querySelectorAll("a[href^='#']"));
  if (!links.length) return;

  var targets = links
    .map(function (a) {
      var el = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  function mark(entry) {
    links.forEach(function (a) {
      a.classList.remove("here");
      a.removeAttribute("aria-current");
    });
    if (entry) {
      entry.link.classList.add("here");
      entry.link.setAttribute("aria-current", "true");
    }
  }

  /* Highlight the heading nearest the top of the viewport. Falls back
     to a scroll listener where IntersectionObserver is unavailable. */
  if ("IntersectionObserver" in window) {
    var visible = {};
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          visible[e.target.id] = e.isIntersecting;
        });
        var current = null;
        for (var i = 0; i < targets.length; i++) {
          if (visible[targets[i].el.id]) { current = targets[i]; break; }
        }
        if (!current) {
          // Nothing intersecting: pick the last heading scrolled past.
          for (var j = targets.length - 1; j >= 0; j--) {
            if (targets[j].el.getBoundingClientRect().top < 140) { current = targets[j]; break; }
          }
        }
        mark(current);
      },
      { rootMargin: "-100px 0px -70% 0px", threshold: 0 }
    );
    targets.forEach(function (t) { io.observe(t.el); });
  } else {
    var tick;
    window.addEventListener("scroll", function () {
      clearTimeout(tick);
      tick = setTimeout(function () {
        var current = targets[0];
        targets.forEach(function (t) {
          if (t.el.getBoundingClientRect().top < 140) current = t;
        });
        mark(current);
      }, 120);
    }, { passive: true });
  }
})();
