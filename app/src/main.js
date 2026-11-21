// Wires the Vice Nights Cover Maker: upload photos, tune each panel,
// pick a layout, grade and size, edit the caption, export a PNG.
// A ?shot= query sets up a fixed scene for a screenshot (see shots.js).
import { drawPoster, SIZES, LAYOUTS, GRADES } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('poster');
const statusEl = document.getElementById('status');
const captionEl = document.getElementById('caption');
const subEl = document.getElementById('subcaption');
const sizeEl = document.getElementById('size');
const layoutEl = document.getElementById('layout');
const gradeEl = document.getElementById('grade');

const state = {
  size: 'square',
  layout: 'hero',
  grade: 'sunset',
  caption: 'SUNSET HEIST',
  subcaption: 'Vice Nights • Summer 2026',
  photos: [null, null, null],
  panelPhoto: [0, 1, 2, 0],
  tune: [
    { zoom: 1, x: 0, y: 0 },
    { zoom: 1, x: 0, y: 0 },
    { zoom: 1, x: 0, y: 0 },
    { zoom: 1, x: 0, y: 0 },
  ],
};

function redraw() {
  drawPoster(canvas, state);
  const size = SIZES[state.size];
  document.getElementById('previewNote').textContent =
    `Preview ${size.w} x ${size.h} — ${LAYOUTS[state.layout]} — ${GRADES[state.grade]}`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function fillSelects() {
  for (const [el, entries, value] of [
    [sizeEl, SIZES, state.size],
    [layoutEl, LAYOUTS, state.layout],
    [gradeEl, GRADES, state.grade],
  ]) {
    for (const [key, entry] of Object.entries(entries)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = typeof entry === 'string' ? entry : entry.label;
      el.appendChild(opt);
    }
    el.value = value;
  }
}

function buildPanelControls() {
  const host = document.getElementById('panels');
  const rects = [0, 1, 2, 3];
  for (const i of rects) {
    const box = document.createElement('fieldset');
    box.className = 'panel';
    const legend = document.createElement('legend');
    legend.textContent = `Panel ${i + 1}`;
    box.appendChild(legend);
    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Photo ';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.dataset.slot = String(i);
    fileLabel.appendChild(file);
    box.appendChild(fileLabel);
    const useSame = document.createElement('label');
    useSame.className = 'check';
    const same = document.createElement('input');
    same.type = 'checkbox';
    same.dataset.same = String(i);
    useSame.append('Use photo 1 here', same);
    box.appendChild(useSame);
    for (const [key, label, min, max, step] of [
      ['zoom', 'Zoom', 1, 2.2, 0.05],
      ['x', 'Move left / right', -50, 50, 1],
      ['y', 'Move up / down', -50, 50, 1],
    ]) {
      const lab = document.createElement('label');
      lab.textContent = `${label} `;
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(key === 'zoom' ? 1 : 0);
      slider.dataset.panel = String(i);
      slider.dataset.tune = key;
      lab.appendChild(slider);
      box.appendChild(lab);
    }
    host.appendChild(box);
  }
  host.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.type === 'file' && t.files[0]) {
      const slot = Number(t.dataset.slot);
      state.photos[slot] = { img: await loadImage(URL.createObjectURL(t.files[0])) };
      statusEl.textContent = `Photo ${slot + 1} loaded.`;
      redraw();
    }
    if (t.dataset.same !== undefined) {
      const i = Number(t.dataset.same);
      state.panelPhoto[i] = t.checked ? 0 : i;
      redraw();
    }
  });
  host.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.tune) {
      state.tune[Number(t.dataset.panel)][t.dataset.tune] = Number(t.value);
      redraw();
    }
  });
}

fillSelects();
buildPanelControls();

captionEl.addEventListener('input', () => { state.caption = captionEl.value; redraw(); });
subEl.addEventListener('input', () => { state.subcaption = subEl.value; redraw(); });
sizeEl.addEventListener('change', () => { state.size = sizeEl.value; redraw(); });
layoutEl.addEventListener('change', () => { state.layout = layoutEl.value; redraw(); });
gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; redraw(); });

document.getElementById('fillAll').addEventListener('click', () => {
  for (let i = 1; i < 4; i++) state.panelPhoto[i] = 0;
  document.querySelectorAll('[data-same]').forEach((c) => { c.checked = true; });
  statusEl.textContent = 'All panels use photo 1.';
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-cover-${size.w}x${size.h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-nights-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, loadImage, captionEl, subEl, redraw);
} else {
  redraw();
}
