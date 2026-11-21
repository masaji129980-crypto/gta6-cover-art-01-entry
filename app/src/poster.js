// Poster drawing engine for Vice Nights Cover Maker.
// drawPoster(canvas, state) paints a multi-panel GTA-style poster cover:
// photos in panels, a sunset or neon colour grade, and bold poster lettering.
// All drawing is plain Canvas 2D; nothing is fetched from the network.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080 Square' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350 Portrait' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080 Wide' },
};

export const LAYOUTS = {
  hero: 'Hero + two side panels',
  grid: 'Four-panel grid',
  boulevard: 'Wide hero + two panels below',
};

export const GRADES = {
  sunset: 'Vice sunset',
  neon: 'Neon nights',
  palm: 'Palm gold',
};

/** Panel rectangles (fractions of the canvas) for each layout and size. */
export function panelRects(layout, w, h) {
  const g = 0.012; // white gutter between panels, as a fraction of width
  const gap = w * g;
  if (layout === 'grid') {
    const hw = (w - gap * 3) / 2;
    const hh = (h - gap * 3) / 2;
    return [
      [gap, gap, hw, hh],
      [gap * 2 + hw, gap, hw, hh],
      [gap, gap * 2 + hh, hw, hh],
      [gap * 2 + hw, gap * 2 + hh, hw, hh],
    ];
  }
  if (layout === 'boulevard') {
    const topH = h * 0.58 - gap;
    const botH = h - topH - gap * 3;
    const bw = (w - gap * 3) / 2;
    return [
      [gap, gap, w - gap * 2, topH],
      [gap, topH + gap * 2, bw, botH],
      [gap * 2 + bw, topH + gap * 2, bw, botH],
    ];
  }
  // hero: big left panel, two stacked panels on the right
  const leftW = w * 0.62 - gap;
  const rightW = w - leftW - gap * 3;
  const rightH = (h - gap * 3) / 2;
  return [
    [gap, gap, leftW, h - gap * 2],
    [leftW + gap * 2, gap, rightW, rightH],
    [leftW + gap * 2, gap * 2 + rightH, rightW, rightH],
  ];
}

function coverFit(ctx, img, x, y, pw, ph, zoom, ox, oy) {
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  const dx = x + (pw - dw) / 2 + (ox / 100) * pw * 0.4;
  const dy = y + (ph - dh) / 2 + (oy / 100) * ph * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, pw, ph);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function gradeOverlay(ctx, grade, w, h) {
  let tint;
  if (grade === 'neon') {
    tint = ctx.createLinearGradient(0, 0, w, h);
    tint.addColorStop(0, 'rgba(255, 45, 200, 0.28)');
    tint.addColorStop(0.55, 'rgba(120, 20, 180, 0.10)');
    tint.addColorStop(1, 'rgba(0, 220, 255, 0.26)');
  } else if (grade === 'palm') {
    tint = ctx.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, 'rgba(255, 190, 60, 0.20)');
    tint.addColorStop(1, 'rgba(0, 110, 90, 0.30)');
  } else {
    tint = ctx.createLinearGradient(0, h * 0.25, 0, h);
    tint.addColorStop(0, 'rgba(255, 120, 60, 0.05)');
    tint.addColorStop(0.6, 'rgba(255, 80, 120, 0.22)');
    tint.addColorStop(1, 'rgba(90, 20, 110, 0.42)');
  }
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  // warm sun glow, top corner
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.12, 10, w * 0.82, h * 0.12, w * 0.55);
  glow.addColorStop(0, grade === 'neon' ? 'rgba(0, 230, 255, 0.30)' : 'rgba(255, 210, 120, 0.34)');
  glow.addColorStop(1, 'rgba(255, 210, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function fitFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  while (size > 16 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
  }
  return size;
}

function drawCaption(ctx, state, w, h) {
  const caption = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim();
  const bandH = h * 0.24;
  const bandY = h - bandH;
  const shade = ctx.createLinearGradient(0, bandY - h * 0.08, 0, h);
  shade.addColorStop(0, 'rgba(20, 4, 40, 0)');
  shade.addColorStop(1, 'rgba(20, 4, 40, 0.82)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY - h * 0.08, w, bandH + h * 0.08);
  // thin neon rule above the caption
  ctx.fillStyle = state.grade === 'neon' ? '#00e5ff' : '#ffb347';
  ctx.fillRect(w * 0.06, bandY + h * 0.015, w * 0.16, Math.max(4, h * 0.006));
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if (caption) {
    const size = fitFont(ctx, caption, w * 0.88, h * 0.115);
    ctx.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = 'rgba(20, 4, 40, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(caption, w * 0.06, h - h * 0.10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(caption, w * 0.06, h - h * 0.10);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (sub) {
    ctx.font = `700 ${Math.round(h * 0.028)}px Arial, sans-serif`;
    ctx.fillStyle = '#ffd9a0';
    ctx.fillText(sub.toUpperCase(), w * 0.06, h - h * 0.035);
  }
  // small original badge, top-left corner
  ctx.font = `800 ${Math.round(h * 0.022)}px Arial, sans-serif`;
  const badge = 'VICE NIGHTS';
  const bw = ctx.measureText(badge).width + h * 0.03;
  ctx.fillStyle = 'rgba(20, 4, 40, 0.78)';
  ctx.fillRect(w * 0.03, h * 0.03, bw, h * 0.045);
  ctx.fillStyle = state.grade === 'neon' ? '#00e5ff' : '#ffb347';
  ctx.fillText(badge, w * 0.03 + h * 0.015, h * 0.03 + h * 0.033);
}

function drawPlaceholder(ctx, x, y, pw, ph, label) {
  const grad = ctx.createLinearGradient(x, y, x + pw, y + ph);
  grad.addColorStop(0, '#3a1650');
  grad.addColorStop(1, '#12082a');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, pw, ph);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(x + 10, y + 10, pw - 20, ph - 20);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.max(14, Math.round(ph * 0.07))}px Arial, sans-serif`;
  ctx.fillText(label, x + pw / 2, y + ph / 2);
  ctx.font = `400 ${Math.max(11, Math.round(ph * 0.04))}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Add a photo', x + pw / 2, y + ph / 2 + ph * 0.09);
}

/** Paints the whole poster onto `canvas` (sized to the chosen export size). */
export function drawPoster(canvas, state) {
  const size = SIZES[state.size] || SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { w, h } = size;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  const slots = state.photos || [];
  rects.forEach((r, i) => {
    const [x, y, pw, ph] = r;
    const slot = slots[state.panelPhoto?.[i] ?? i] || null;
    const tune = state.tune?.[i] || { zoom: 1, x: 0, y: 0 };
    if (slot && slot.img) {
      coverFit(ctx, slot.img, x, y, pw, ph, tune.zoom, tune.x, tune.y);
    } else {
      drawPlaceholder(ctx, x, y, pw, ph, `PANEL ${i + 1}`);
    }
  });
  gradeOverlay(ctx, state.grade, w, h);
  drawCaption(ctx, state, w, h);
}
