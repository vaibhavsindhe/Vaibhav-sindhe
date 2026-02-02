export class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.anchor = this.querySelector("a");
    if (!this.anchor) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadNextPage();
        }
      });
    });


    const wrapper = this.closest("[data-product-grid]");
    const isGated = wrapper?.getAttribute("data-featured-state") === "loading";
    if (wrapper && isGated) {
      this._gateObserver = new MutationObserver(() => {
        const ready = wrapper.getAttribute("data-featured-state") === "ready";
        if (!ready) return;
        this._gateObserver?.disconnect();
        this.observer.observe(this);
      });
      this._gateObserver.observe(wrapper, {
        attributes: true,
        attributeFilter: ["data-featured-state"],
      });
      return;
    }

    this.observer.observe(this);
  }

  disconnectedCallback() {
    this._gateObserver?.disconnect();
    this.observer?.disconnect();
  }

  async loadNextPage() {
    this.observer.disconnect();

    this.anchor.style.display = "flex";
    this.anchor.innerText = "Loading...";

    const url = this.anchor.getAttribute("href");
    if (!url) return;

    try {
      await window.__collectionFeaturedState?.ready;

      const response = await fetch(url);
      const text = await response.text();
      const html = new DOMParser().parseFromString(text, "text/html");

      const newGrid = html.querySelector("#product-grid");
      const grid = document.querySelector("#product-grid");
      if (newGrid && grid) {
        const featuredState = window.__collectionFeaturedState || null;
        const featuredHandles = featuredState?.handles || null;
        const renderedFeaturedHandles = featuredState?.renderedHandles || null;
        const allFeaturedPrefetched = Boolean(featuredState?.allFeaturedPrefetched);
        const insertFeatured = featuredState?.insertFeaturedIntoGrid || null;

        Array.from(newGrid.children).forEach((child) => {
          const handle = (child?.dataset?.productHandle || "").toLowerCase();
          const badge = child?.querySelector?.(".card__badge.top .badge");
          const badgeText = (badge?.textContent || "").trim().toLowerCase();
          const isFeaturedByBadge = badgeText === "featured";
          const isFeaturedByHandle = Boolean(featuredHandles && handle && featuredHandles.has(handle));
          const isFeatured = isFeaturedByHandle || isFeaturedByBadge;

          if (isFeatured) {
            // If we prefetched+inserted all featured upfront, drop featured items from later pages to avoid duplicates.
            if (allFeaturedPrefetched) return;

            // Ensure badge-detected featured products are tracked too.
            if (isFeaturedByBadge && featuredHandles && handle) featuredHandles.add(handle);
            if (renderedFeaturedHandles && handle && renderedFeaturedHandles.has(handle)) return;

            if (typeof insertFeatured === "function") {
              insertFeatured(child);
            } else {
              grid.prepend(child);
            }
            if (renderedFeaturedHandles && handle) renderedFeaturedHandles.add(handle);
            return;
          }

          grid.appendChild(child);
        });
      }

      const newInfinite = html.querySelector("infinite-scroll");
      if (newInfinite) {
        this.replaceWith(newInfinite);
      } else {
        this.remove();
      }
    } catch (err) {
      console.error("InfiniteScroll error:", err);
    }

    this.anchor.style.display = "none";
    this.anchor.innerText = "";
  }
}

if (!customElements.get("infinite-scroll")) {
  customElements.define("infinite-scroll", InfiniteScroll);
}

(() => {
  const state = window.__collectionFeaturedState || {
    handles: new Set(),
    renderedHandles: new Set(),
    allFeaturedPrefetched: false,
    ready: Promise.resolve(),
    _hasRunOnce: false,
  };

  function normalizeHref(href) {
    if (!href) return null;
    try {
      return new URL(href, window.location.href).toString();
    } catch {
      return null;
    }
  }

  function getFeaturedBadgeText(li) {
    const badge = li?.querySelector?.(".card__badge.top .badge");
    return (badge?.textContent || "").trim().toLowerCase();
  }

  function isFeaturedLi(li) {
    return getFeaturedBadgeText(li) === "featured";
  }

  function getHandleFromLi(li) {
    return String(li?.dataset?.productHandle || "").toLowerCase();
  }

  function insertFeaturedIntoGrid(li) {
    const grid = document.querySelector("#product-grid");
    if (!grid || !li) return;

    const featuredClass = "is-featured-product";
    li.classList.add(featuredClass);

    const featuredItems = grid.querySelectorAll(`.${featuredClass}`);
    const lastFeatured = featuredItems.length ? featuredItems[featuredItems.length - 1] : null;

    if (lastFeatured && lastFeatured.parentElement === grid) {
      lastFeatured.insertAdjacentElement("afterend", li);
    } else {
      grid.prepend(li);
    }
  }

  function readNextPageHrefFromDoc(doc) {
    return normalizeHref(doc?.querySelector?.("infinite-scroll a[href]")?.getAttribute?.("href"));
  }

  function getSectionId() {
    return document.getElementById("product-grid")?.dataset?.id || null;
  }

  function buildSectionUrlFromCurrentSearch() {
    const sectionId = getSectionId();
    if (!sectionId) return null;

    const search = window.location.search ? window.location.search.replace(/^\?/, "") : "";
    const base = `${window.location.pathname}?section_id=${encodeURIComponent(sectionId)}`;
    return search ? `${base}&${search}` : base;
  }

  function collectFeaturedLisFromGrid(gridEl, { importIntoDocument } = {}) {
    if (!gridEl) return [];
    const out = [];

    Array.from(gridEl.children).forEach((li) => {
      const handle = getHandleFromLi(li);
      if (!handle) return;
      if (!isFeaturedLi(li)) return;
      if (state.handles.has(handle)) return;

      state.handles.add(handle);

      const node = importIntoDocument ? document.importNode(li, true) : li;
      out.push(node);
    });

    return out;
  }

  function printFeaturedSummary() {
    const grid = document.querySelector("#product-grid");
    if (!grid) return;
    const titles = [];

    grid.querySelectorAll(".is-featured-product").forEach((li) => {
      const handle = getHandleFromLi(li);
      const title = (li.querySelector(".card__heading a")?.textContent || "").trim();
      titles.push({ handle, title });
    });

    console.log("[Featured products]", titles);
  }

  async function runFeaturedForCurrentUrl() {
    const wrapper = document.querySelector('[data-product-grid][data-collection-handle]');
    if (wrapper) {
      wrapper.setAttribute("data-featured-state", "loading");
      if (!state._hasRunOnce) wrapper.setAttribute("data-featured-fullscreen", "true");
    }

    state.insertFeaturedIntoGrid = insertFeaturedIntoGrid;
    state.handles = new Set();
    state.renderedHandles = new Set();
    state.allFeaturedPrefetched = false;

    const grid = document.querySelector("#product-grid");
    if (!grid) {
      if (wrapper) wrapper.setAttribute("data-featured-state", "ready");
      return;
    }

    const initialLimit = grid.children.length;

    const firstUrl = buildSectionUrlFromCurrentSearch();
    let firstDoc = null;
    if (firstUrl) {
      const firstRes = await fetch(firstUrl, { credentials: "same-origin" });
      if (firstRes.ok) {
        const firstText = await firstRes.text();
        firstDoc = new DOMParser().parseFromString(firstText, "text/html");
      }
    }

    const featuredLis = [];
    featuredLis.push(...collectFeaturedLisFromGrid(grid, { importIntoDocument: false }));

    const params = new URLSearchParams(window.location.search || "");
    const hasFilters = Array.from(params.keys()).some((k) => k.startsWith("filter."));
    const hasSort = params.has("sort_by");
    // Prefetching many pages on every filter/sort change is expensive; rely on badge-detection for later pages instead.
    const MAX_PREFETCH_PAGES = hasFilters || hasSort ? 0 : 50;
    let pagesFetched = 0;
    let nextHref = firstDoc
      ? readNextPageHrefFromDoc(firstDoc)
      : normalizeHref(document.querySelector("infinite-scroll a[href]")?.getAttribute("href"));

    while (nextHref && pagesFetched < MAX_PREFETCH_PAGES) {
      const res = await fetch(nextHref, { credentials: "same-origin" });
      if (!res.ok) break;

      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");

      const nextGrid = doc.querySelector("#product-grid");
      featuredLis.push(...collectFeaturedLisFromGrid(nextGrid, { importIntoDocument: true }));

      nextHref = readNextPageHrefFromDoc(doc);
      pagesFetched += 1;
    }

    if (featuredLis.length) {
      const frag = document.createDocumentFragment();
      featuredLis.forEach((li) => {
        const handle = getHandleFromLi(li);
        if (handle) state.renderedHandles.add(handle);
        li.classList.add("is-featured-product");
        frag.appendChild(li);
      });
      grid.prepend(frag);
    }

    if (initialLimit > 0) {
      while (grid.children.length > initialLimit) {
        grid.lastElementChild?.remove();
      }
    }

    // "All featured prefetched" only when we actually paged until no next link.
    state.allFeaturedPrefetched = MAX_PREFETCH_PAGES > 0 && !nextHref;
    state._hasRunOnce = true;

    printFeaturedSummary();

    if (wrapper) {
      wrapper.setAttribute("data-featured-state", "ready");
      wrapper.removeAttribute("data-featured-fullscreen");
    }
  }

  function start() {
    state.ready = runFeaturedForCurrentUrl().catch((err) => {
      console.error("Featured products fetch error:", err);

      const wrapper = document.querySelector('[data-product-grid][data-collection-handle]');
      if (wrapper) {
        wrapper.setAttribute("data-featured-state", "ready");
        wrapper.removeAttribute("data-featured-fullscreen");
      }
    });
  }

  start();

  window.addEventListener("collection:product-grid:updated", () => {
    // Re-run pinning after the grid is replaced (e.g. after applying filters/sort).
    start();
  });

  window.__collectionFeaturedState = state;
})();