// One live-context budget, shared by every ModelViewer on the page.
//
// Each viewer is its own WebGLRenderer, and a browser keeps a hard ceiling
// on how many WebGL contexts one page may hold. Chrome's is around a dozen:
// past it, it logs "Too many active WebGL contexts. Oldest context will be
// lost." and starts killing them, oldest first. A lost context renders
// nothing, so the card it belonged to is left with an empty frame — which
// is the exact thing that having every model live was meant to prevent. The
// Projects board has fourteen viewers, so it sat over the ceiling and the
// browser quietly blanked the cards at the top.
//
// The board used to dodge this by building models for the first six cards
// by array index. That is worse than it sounds: which cards are dead has
// nothing to do with where you are on the page, so scrolling down showed
// nothing but empty frames.
//
// So the page keeps a budget instead. Every viewer registers its element,
// the budget ranks them by distance from the middle of the viewport, and the
// nearest BUDGET of them hold contexts. Scroll, and the ranking changes:
// whatever you are looking at is live, and whatever is far away gives up its
// context rather than costing a visible card its own.
//
// The remaining limit is honest and worth knowing: if a viewport is tall
// enough to show more than BUDGET cards at once, the ones furthest from the
// centre will be waiting. Rendering all of them at once needs a single
// shared renderer blitting into per-card 2D canvases, which is a different
// and much larger change than this.

// Comfortably under Chrome's ceiling, and more than a 900px window can show
// of the Projects board (about ten cards at three columns).
const BUDGET = 10;

// element -> { el, notify, live }
const viewers = new Map();
let pending = null;

function rank() {
  pending = null;
  const middle = window.innerHeight / 2;

  const ordered = [...viewers.values()]
    .map((v) => {
      const r = v.el.getBoundingClientRect();
      return { v, distance: Math.abs(r.top + r.height / 2 - middle) };
    })
    .sort((a, b) => a.distance - b.distance);

  for (let i = 0; i < ordered.length; i++) {
    const { v } = ordered[i];
    const live = i < BUDGET;
    if (live !== v.live) {
      v.live = live;
      v.notify(live);
    }
  }
}

// Coalesced with a timer rather than requestAnimationFrame: a frame callback
// never fires while the tab is hidden, and a viewer that registered in a
// hidden tab would then never be told it may build.
function schedule() {
  if (pending !== null) return;
  pending = setTimeout(rank, 60);
}

function onScroll() {
  schedule();
}

function listen(on) {
  const fn = on ? addEventListener : removeEventListener;
  fn.call(window, "scroll", onScroll, { passive: true });
  fn.call(window, "resize", onScroll);
}

/**
 * Ask for a WebGL context for `el`.
 *
 * `notify(live)` is called whenever the answer changes, including the first
 * time. Returns an unsubscribe function; call it on unmount.
 */
export function claimContext(el, notify) {
  if (viewers.size === 0) listen(true);
  viewers.set(el, { el, notify, live: false });
  // Synchronously, not scheduled: the common case is a page with fewer
  // viewers than the budget, and making those wait on a timer would show a
  // frame of empty boxes on every navigation.
  rank();

  return () => {
    viewers.delete(el);
    if (viewers.size === 0) {
      listen(false);
      if (pending !== null) {
        clearTimeout(pending);
        pending = null;
      }
      return;
    }
    // A context just came free, so someone else may be owed it.
    schedule();
  };
}
