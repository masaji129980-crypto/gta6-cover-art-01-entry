// Fixed scenes for screenshots, so every shot is reproducible:
// ?shot=loaded shows the editor with demo photos in the panels;
// ?shot=exported shows one exported cover alone, full-bleed;
// ?shot=portrait the same in 1080 x 1350; ?shot=grid a four-panel cover.
// window.__shotReady is set once the cover has been painted.
const DEMOS = ['samples/demo-sunset.png', 'samples/demo-neon.png', 'samples/demo-beach.png'];

async function loadDemos(state, loadImage, caption, sub) {
  const imgs = await Promise.all(DEMOS.map((src) => loadImage(src)));
  state.photos = imgs.map((img) => ({ img }));
  state.panelPhoto = [0, 1, 2, 0];
  state.caption = caption;
  state.subcaption = sub;
}

export async function runShot(shot, query, state, loadImage, captionEl, subEl, redraw) {
  const caption = query.get('caption') ?? 'SUNSET HEIST';
  const sub = query.get('sub') ?? 'Vice Nights • Summer 2026';
  if (shot === 'exported' || shot === 'portrait' || shot === 'grid') {
    document.body.classList.add('shot-cover');
  }
  if (shot === 'portrait') state.size = 'portrait';
  if (shot === 'exported') state.size = 'wide';
  if (shot === 'grid') { state.size = 'square'; state.layout = 'grid'; state.grade = 'neon'; }
  if (shot === 'loaded') state.grade = 'sunset';
  await loadDemos(state, loadImage, caption, sub);
  captionEl.value = state.caption;
  subEl.value = state.subcaption;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
