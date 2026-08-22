// Waypoints for the topographic site map: the nav graph paired with the
// generated coordinates that place each dot on the terrain.
//
// The nav graph itself lives in siteTree.js, which the branching menu
// also reads, so there is one list of what pages exist. Positions live in
// the generated mapGeometry.js, because tools/generate-map.py bends the
// trail paths in mapTrails.js to the same coordinates: when positions
// were hand-copied into this file, the dots and their own trails could
// silently drift apart.
//
// NOTE: the branching menu (MenuTree.jsx) replaced the map as the site's
// navigation. This module and the generator behind it are kept intact
// while the new menu settles in, but nothing renders them right now.
import { mapPositions, zoomTargets } from "./mapGeometry";
import { NAV } from "./siteTree";

export { zoomTargets };

// Fail loudly rather than dropping a dot at 0,0 — a waypoint with no
// generated position means mapGeometry.js is stale.
export const mapWaypoints = NAV.map((wp) => {
  const pos = mapPositions[wp.node];
  if (!pos) {
    throw new Error(
      `No generated position for site-map waypoint "${wp.node}". ` +
        "Run `npm run generate-map` to refresh src/data/mapGeometry.js.",
    );
  }
  return { ...wp, x: pos[0], y: pos[1] };
});
