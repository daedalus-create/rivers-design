// Rivers Design — shared page behavior

// Live date badge, formatted like the Figma comp: 08 / 16 / 2026
document.querySelectorAll('[data-date-badge]').forEach((el) => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const yyyy = now.getFullYear();
  el.innerHTML =
    `${mm}<span class="slash">/</span>${dd}<span class="slash">/</span>${yyyy}`;
});

// Hamburger menu / site minimap overlay
const menuBtn = document.querySelector('[data-menu-toggle]');
const menuOverlay = document.querySelector('.menu-overlay');
if (menuBtn && menuOverlay) {
  const setMenu = (open) => {
    menuOverlay.classList.toggle('open', open);
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!menuOverlay.classList.contains('open')));
  menuOverlay.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // Interactive site map: only the four hub waypoints (Home,
  // Experience, Projects, About) show at first. Clicking a hub
  // zooms .map__scene into that territory and reveals its child
  // waypoints — click the same hub again (or its own dot) to
  // actually navigate there.
  const mapEl = menuOverlay.querySelector('.map');
  const scene = mapEl && mapEl.querySelector('.map__scene');
  if (mapEl && scene) {
    // fraction-of-container center + fill scale for each territory,
    // derived from the REGIONS ellipses in tools/generate-map.py
    const TARGETS = {
      experience: { fx: 0.215, fy: 0.60, scale: 1.4 },
      projects: { fx: 0.528, fy: 0.725, scale: 1.4 },
      about: { fx: 0.845, fy: 0.52, scale: 1.65 },
    };

    const applyZoom = (cluster) => {
      if (!cluster) {
        scene.style.transform = '';
        mapEl.removeAttribute('data-zoom');
        return;
      }
      const { fx, fy, scale } = TARGETS[cluster];
      const w = mapEl.clientWidth, h = mapEl.clientHeight;
      const tx = w / 2 - scale * w * fx;
      const ty = h / 2 - scale * h * fy;
      scene.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      mapEl.setAttribute('data-zoom', cluster);
    };

    mapEl.querySelectorAll('.wp[data-cluster="hub"]').forEach((hub) => {
      const node = hub.dataset.node;
      hub.addEventListener('click', (e) => {
        if (node === 'home') {
          if (mapEl.getAttribute('data-zoom')) {
            e.preventDefault();
            e.stopPropagation();
            applyZoom(null);
          }
          return;
        }
        if (mapEl.getAttribute('data-zoom') === node) return; // 2nd click: navigate
        e.preventDefault();
        e.stopPropagation();
        applyZoom(node);
      });
    });

    const backBtn = mapEl.querySelector('.map__back');
    if (backBtn) backBtn.addEventListener('click', () => applyZoom(null));

    mapEl.addEventListener('click', (e) => {
      if (e.target === mapEl || e.target === scene) applyZoom(null);
    });

    // Escape zooms back out first; a second Escape closes the whole menu
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mapEl.getAttribute('data-zoom')) {
        e.stopImmediatePropagation();
        applyZoom(null);
      }
    }, true);

    new MutationObserver(() => {
      if (!menuOverlay.classList.contains('open')) applyZoom(null);
    }).observe(menuOverlay, { attributes: true, attributeFilter: ['class'] });
  }
}

// Reveal-on-scroll with stagger, matching the reference site's enters
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    }
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
