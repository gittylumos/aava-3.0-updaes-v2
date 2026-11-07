// AAVA 3.0 launch film: a pure function of time. window.seek(t) paints frame t (lib/motion.js).
// Timing is in beats (u) on the measured grid (beats.json, 124.14 bpm, 60 beats = 29 s).
// docs/shotlist.md is the plan this file follows. Every screen is a real capture of the running
// prototype (assets/shots/), only cropped, tilted and moved; the copy is the product's own.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, ring, bump, noise1, hash01, mulberry32, fill, rrect, font } = M;

// Brand tokens from app/src/design/tokens.css. One accent: the aurora (used as one gradient).
const C = {
  ground: '#0F1117', slab: '#181B25', raised: '#212530', text: '#F1F5F9', dim: '#CBD5E1',
  muted: '#94A3B8', border: '#2D3348', a1: '#FF7AC6', a2: '#A78BFA', a3: '#5B9DFF',
};
const DISPLAY = 'Display', UI = 'UI';
const DEG = Math.PI / 180;

// Every accent: [beat, label, sfx, opts]. sfx.mjs voices each one on its frame.
const HITS = [
  [0, 'Ten', 'tick', { gain: 0.16 }],
  [1, 'steps.', 'tick', { gain: 0.14 }],
  [2, 'Eight', 'tick', { gain: 0.16 }],
  [3, 'tools.', 'tick', { gain: 0.14 }],
  [4.5, 'context-switch line', 'blip', { pitch: 'A5', gain: 0.1 }],
  [8, 'home lands on the drop', 'swell+thud', { gain: 0.32, len: 0.9 }],
  [9.5, 'caption: Work finds you', 'pop', { pitch: 'D5', gain: 0.18 }],
  [15.5, 'recommended ring', 'blip', { pitch: 'D6', gain: 0.12, verb: 0.4 }],
  [20, 'match cut into the run', 'whoosh', { len: 0.7, from: 500, to: 2600, gain: 0.22 }],
  [21.5, 'caption: Ready before you are', 'pop', { pitch: 'F5', gain: 0.18 }],
  [26, 'gate lifts', 'whoosh', { len: 0.45, from: 900, to: 2200, gain: 0.16 }],
  [30, 'Raise both PRs', 'click', { gain: 0.22 }],
  [32, 'whip to validator', 'whoosh', { len: 0.5, from: 2400, to: 600, pan: 0.3, gain: 0.24 }],
  [33, 'caption: It stops where you decide', 'pop', { pitch: 'A5', gain: 0.18 }],
  [38, 'dolly to the gate', 'whoosh', { len: 1.2, from: 300, to: 1200, gain: 0.12 }],
  [41, 'Approve', 'click', { gain: 0.24 }],
  [44, 'pull back', 'whoosh', { len: 0.6, from: 2000, to: 500, gain: 0.18 }],
  [44.3, 'pane: home', 'tick', { gain: 0.14, pan: -0.5 }],
  [44.8, 'pane: PRD', 'tick', { gain: 0.14, pan: -0.15 }],
  [45.3, 'pane: review', 'tick', { gain: 0.24, pan: 0.2 }],
  [46.5, 'caption: One place', 'pop', { pitch: 'D5', gain: 0.18 }],
  [52, 'end card mark', 'impact', { gain: 0.5 }],
  [52.5, 'AAVA 3.0', 'bell', { pitch: 'D6', gain: 0.18, verb: 0.5 }],
  [54, 'tagline', 'pop', { pitch: 'A4', gain: 0.12 }],
  [56, 'aurora sweep on the mark', 'blip', { pitch: 'A6', gain: 0.08, verb: 0.6 }],
];

// ---------------------------------------------------------------- shared pieces

const SHOT_W = 3200, SHOT_H = 2000;                 // captures are 1600x1000 CSS at 2x
const PW = 1180, PH = PW * SHOT_H / SHOT_W;          // the landed screen
const PCX = 1250, PCY = 560;
const SC = PW / SHOT_W;
const PX0 = PCX - PW / 2, PY0 = PCY - PH / 2;
const onPane = (sx, sy) => [PX0 + sx * SC, PY0 + sy * SC];

// Real UI regions, in capture pixels.
const R = {
  homeCard: [870, 757, 640, 320],
  previewForm: [1333, 216, 1816, 776],
  reviewGate: [206, 1461, 1010, 490],
  raiseBtn: [955, 1853, 234, 72],
  valGate: [206, 1461, 1010, 490],
  approveBtn: [784, 1853, 405, 72],
};
const centre = ([x, y, w, h]) => onPane(x + w / 2, y + h / 2);

let G = null;   // scratch canvases + sprites, made once in init

function ambient(ctx, u, amt = 1) {
  fill(ctx, C.ground);
  // the app's AmbientField: three aurora lobes (indigo top-left, violet low-right, pink bottom)
  const lobes = [
    [99, 102, 241, 0.12, 0.06, 0.56, 0.44, 0.17],
    [167, 139, 250, 0.96, 0.78, 0.50, 0.46, 0.13],
    [255, 122, 198, 0.54, 1.10, 0.36, 0.32, 0.09],
  ];
  lobes.forEach(([r, g, b, x, y, rx, ry, a], i) => {
    const cx = (x + 0.03 * noise1(u * 0.06, 11 + i)) * W, cy = (y + 0.03 * noise1(u * 0.05, 21 + i)) * H;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(rx * W, ry * H);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gr.addColorStop(0, `rgba(${r},${g},${b},${a * amt})`);
    gr.addColorStop(0.64, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr; ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  });
}

function aurora(ctx, x0, x1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, C.a1); g.addColorStop(0.5, C.a2); g.addColorStop(1, C.a3);
  return g;
}

// Soft blur-in type. lines: [[word, accent?], ...] per line; words resolve one after another.
function caption(ctx, u, lines, o) {
  const { x, y, size, lh = size * 1.06, u0, step = 0.5, dur = 2.4, out = 1e9, outDur = 1.1, weight = 620, color = C.text } = o;
  const f = font(size, weight, DISPLAY), track = -0.035 * size;
  ctx.font = f; ctx.letterSpacing = `${track}px`;
  const space = ctx.measureText(' ').width;
  let n = 0;
  lines.forEach((line, li) => {
    let cx = x;
    const base = y + li * lh;
    line.forEach(([word, accent]) => {
      ctx.font = f; ctx.letterSpacing = `${track}px`;
      const w = ctx.measureText(word).width;
      const s0 = u0 + n * step;
      const k = E.outCubic(prog(u, s0, s0 + dur));
      const e = E.inCubic(prog(u, out + n * 0.05, out + n * 0.05 + outDur));
      const a = k * (1 - e);
      if (a > 0.002) {
        const blur = 26 * (1 - k) ** 1.4 + 22 * e;
        const sc = 1 + 0.06 * (1 - k) - 0.03 * e;
        ctx.save();
        ctx.globalAlpha = a;
        if (blur > 0.25) ctx.filter = `blur(${blur.toFixed(2)}px)`;
        ctx.translate(cx + w / 2, base - size * 0.35 + 30 * (1 - k) - 24 * e);
        ctx.scale(sc, sc);
        ctx.font = f; ctx.letterSpacing = `${track}px`; ctx.textAlign = 'left';
        ctx.fillStyle = accent ? aurora(ctx, -w / 2, w / 2) : color;
        ctx.fillText(word, -w / 2, size * 0.35);
        ctx.restore();
      }
      cx += w + space; n++;
    });
  });
  ctx.letterSpacing = '0px';
}

// A real screen as a floating pane. tilt leans the top away (rotateX, drawn in strips for true
// perspective); roll is in-plane; blur defocuses (through a scratch canvas so strips don't seam).
function pane(ctx, img, o) {
  const { src = [0, 0, SHOT_W, SHOT_H], cx, cy, w, tilt = 0, roll = 0, alpha = 1, blur = 0, shadow = 1, zoom = 1, radius = 14 } = o;
  if (alpha <= 0.002 || w < 2) return;
  if (blur > 0.3) {
    const s = G.scratch, sc = G.sctx;
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, H);
    sc.setTransform(ctx.getTransform());
    pane(sc, img, { ...o, blur: 0, alpha: 1 });
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= alpha; ctx.filter = `blur(${blur.toFixed(2)}px)`;
    ctx.drawImage(s, 0, 0); ctx.restore();
    return;
  }
  const [sx, sy, sw, sh] = src;
  const h = w * sh / sw;
  // pick the half-size copy when the screen is drawn small (cleaner downsampling, cheaper)
  const useHalf = (w / sw) * zoom < 0.55;
  const im = useHalf ? img.half : img.full, k = useHalf ? 0.5 : 1;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy); ctx.rotate(roll);
  const ct = Math.cos(tilt), st = Math.sin(tilt), f = 2400;
  const proj = (y) => { const z = -y * st; const p = f / (f + z); return [y * ct * p, p]; };
  if (shadow > 0) {
    const [yt, pt] = proj(-h / 2), [yb, pb] = proj(h / 2);
    const ww = w * Math.max(pt, pb), hh = yb - yt;
    ctx.save(); ctx.globalAlpha *= 0.62 * shadow;
    ctx.drawImage(G.shadow, -ww * 0.682, yt - hh * 0.333 + hh * 0.05, ww * 1.364, hh * 1.667);
    ctx.restore();
  }
  if (Math.abs(tilt) < 0.0015) {
    ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, radius * w / PW); ctx.clip();
    ctx.drawImage(im, sx * k, sy * k, sw * k, sh * k, -w / 2, -h / 2, w, h);
    ctx.restore();
    rrect(ctx, -w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, radius * w / PW);
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke();
  } else {
    const N = clamp(Math.ceil((h * Math.abs(st)) / 5), 8, 140);
    for (let i = 0; i < N; i++) {
      const y0 = -h / 2 + (i / N) * h, y1 = -h / 2 + ((i + 1) / N) * h;
      const [p0, s0] = proj(y0), [p1, s1] = proj(y1);
      const s = (s0 + s1) / 2;
      ctx.drawImage(im, sx * k, (sy + (i / N) * sh) * k, sw * k, (sh / N) * k, -w * s / 2, p0, w * s, p1 - p0 + 0.6);
    }
    const [yt, pt] = proj(-h / 2), [yb, pb] = proj(h / 2);
    ctx.beginPath();
    ctx.moveTo(-w * pt / 2, yt); ctx.lineTo(w * pt / 2, yt); ctx.lineTo(w * pb / 2, yb); ctx.lineTo(-w * pb / 2, yb); ctx.closePath();
    ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}

// A crop of a real screen lifted toward camera: from where it sits on the landed pane to a target.
function lift(ctx, img, rect, k, target, press = null) {
  const [x, y] = onPane(rect[0], rect[1]);
  const w0 = rect[2] * SC, h0 = rect[3] * SC;
  const cx = lerp(x + w0 / 2, target.cx, k), cy = lerp(y + h0 / 2, target.cy, k);
  const w = lerp(w0, target.w, k), h = w * rect[3] / rect[2];
  ctx.save();
  ctx.globalAlpha *= 0.75 * clamp(k * 2);
  ctx.drawImage(G.shadow, cx - w * 0.682, cy - h * 0.833 + h * (0.04 + 0.08 * k), w * 1.364, h * 1.667);
  ctx.restore();
  ctx.save();
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, 10 * w / 1000); ctx.clip();
  ctx.drawImage(img.full, rect[0], rect[1], rect[2], rect[3], cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  if (press) pressBtn(ctx, img, rect, press.rect, press.amt, cx - w / 2, cy - h / 2, w / rect[2]);
}

// A real button pressed: its own crop redrawn over itself, squashed toward its centre.
function pressBtn(ctx, img, parent, b, amt, ox, oy, s) {
  if (amt <= 0.001) return;
  const bx = ox + (b[0] - parent[0]) * s, by = oy + (b[1] - parent[1]) * s, bw = b[2] * s, bh = b[3] * s;
  const q = 1 - 0.07 * amt;
  ctx.save();
  ctx.fillStyle = C.slab; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(q, q);
  ctx.drawImage(img.full, b[0], b[1], b[2], b[3], -bw / 2, -bh / 2, bw, bh);
  ctx.restore();
}

// Camera: zoom s about focus (fx, fy), which is brought to the frame centre.
function cam(ctx, s, fx, fy) { ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-fx, -fy); }
const logZ = (a, b, p) => a * (b / a) ** p;
const LAND = E.bezier(0.33, 0.0, 0.18, 1);   // eases late: still travelling at u7.5, settled on the drop

// The AAVA mark: the two-tone "A" on its black disc (vector redraw of assets/aava-logo.png).
const MARK_L = [[255, 133], [213, 147], [145, 376], [205, 366], [217, 292], [255, 290], [255, 240], [237, 240], [255, 180]];
const MARK_R = [[255, 133], [300, 148], [370, 376], [310, 366], [297, 292], [255, 290], [255, 240], [275, 240], [255, 180]];
function markPath(ctx, pts) { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - 256, y - 256) : ctx.moveTo(x - 256, y - 256))); ctx.closePath(); }
function mark(ctx, cx, cy, d, sweep = -1) {
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(d / 512, d / 512);
  ctx.beginPath(); ctx.arc(0, 0, 256, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = C.border; ctx.stroke();
  markPath(ctx, MARK_L); ctx.fillStyle = '#BDBDBD'; ctx.fill();
  markPath(ctx, MARK_R); ctx.fillStyle = '#FFFFFF'; ctx.fill();
  if (sweep > -1 && sweep < 2) {
    // one aurora pass across the glyph, on the resolve chord
    ctx.save();
    ctx.beginPath(); MARK_L.forEach(([x, y], i) => (i ? ctx.lineTo(x - 256, y - 256) : ctx.moveTo(x - 256, y - 256))); ctx.closePath();
    MARK_R.forEach(([x, y], i) => (i ? ctx.lineTo(x - 256, y - 256) : ctx.moveTo(x - 256, y - 256))); ctx.closePath();
    ctx.clip();
    const bx = lerp(-420, 420, sweep);
    const g = ctx.createLinearGradient(bx - 160, -120, bx + 160, 120);
    g.addColorStop(0, 'rgba(255,122,198,0)'); g.addColorStop(0.35, 'rgba(255,122,198,0.85)');
    g.addColorStop(0.5, 'rgba(167,139,250,0.95)'); g.addColorStop(0.65, 'rgba(91,157,255,0.85)'); g.addColorStop(1, 'rgba(91,157,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-256, -256, 512, 512);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- S1 headline   (u 0..8)
function sceneHeadline(ctx, u) {
  const push = 1 + 0.035 * E.inOutSine(prog(u, -1, 8));
  ctx.save();
  M.zoomAbout(ctx, push, 160, 560);
  const out = 5.0;
  caption(ctx, u, [[['Ten'], ['steps.']], [['Eight'], ['tools.']]], { x: 160, y: 470, size: 178, lh: 188, u0: -1.7, step: 1.0, dur: 2.6, out, outDur: 1.5, weight: 640 });
  caption(ctx, u, [[['Fifteen-plus context switches.'], ['Two to four hours.', true]]], { x: 166, y: 790, size: 54, u0: 4.5, step: 0.45, dur: 2.0, out: out + 0.2, outDur: 1.4, weight: 480, color: C.muted });
  ctx.restore();
}

// ---------------------------------------------------------------- S2 home flies in   (u 5.4..20)
function sceneHome(ctx, u, IMG) {
  const k = LAND(prog(u, 5.6, 8));
  const tilt = 64 * DEG * (1 - k) - 2.6 * DEG * ring(u - 8, 1.1, 3.5);
  const cy = lerp(PCY + 820, PCY, k) + 10 * ring(u - 8, 1.1, 3.5);
  const roll = -5 * DEG * (1 - k) ** 2;
  // the push into the first task card: accelerating into the cut (in, cut, out)
  const p = E.inQuad(prog(u, 13.6, 20));
  const s = logZ(1, 2.9, p);
  const [fx0, fy0] = centre(R.homeCard);
  ctx.save();
  cam(ctx, s, lerp(W / 2, fx0, E.inOutSine(prog(u, 13.6, 18.5))), lerp(H / 2, fy0, E.inOutSine(prog(u, 13.6, 18.5))));
  pane(ctx, IMG.home, { cx: PCX, cy, w: PW, tilt, roll, zoom: s, alpha: clamp(k * 3) });
  // the product's own "recommended" aurora ring around the card it finished
  const rk = E.outCubic(prog(u, 15.5, 17));
  if (rk > 0) {
    const [x, y] = onPane(R.homeCard[0], R.homeCard[1]);
    const w = R.homeCard[2] * SC, h = R.homeCard[3] * SC;
    const g = ctx.createConicGradient(u * 0.9, x + w / 2, y + h / 2);
    g.addColorStop(0, C.a1); g.addColorStop(0.33, C.a2); g.addColorStop(0.66, C.a3); g.addColorStop(1, C.a1);
    ctx.save(); ctx.globalAlpha = rk; ctx.strokeStyle = g; ctx.lineWidth = 1.7;
    rrect(ctx, x - 1.5, y - 1.5, w + 3, h + 3, 7.5); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  caption(ctx, u, [[['Work']], [['finds', true], ['you.']]], { x: 120, y: 520, size: 96, u0: 9.5, step: 0.5, out: 13.2 });
}

// ---------------------------------------------------------------- S3 ready before you are   (u 20..32.4)
function sceneReview(ctx, u, IMG, dx = 0) {
  ctx.save(); ctx.translate(dx, 0);
  const p = E.outCubic(prog(u, 20, 24));
  const s = logZ(2.6, 1, p);
  const [fx0, fy0] = centre(R.previewForm);
  const lk = springU(u, 26, { stiffness: 150, damping: 19 });
  ctx.save();
  cam(ctx, s, lerp(fx0, W / 2, p), lerp(fy0, H / 2, p));
  pane(ctx, IMG.review, { cx: PCX, cy: PCY, w: PW, zoom: s });
  if (lk > 0) { ctx.globalAlpha = 0.62 * clamp(lk); fill(ctx, C.ground); ctx.globalAlpha = 1; }
  ctx.restore();
  caption(ctx, u, [[['Ready']], [['before', true]], [['you are.']]], { x: 120, y: 420, size: 96, lh: 104, u0: 21.5, step: 0.5, out: 25.0 });
  if (lk > 0) lift(ctx, IMG.review, R.reviewGate, lk, { cx: 960, cy: 545, w: 980 * logZ(1, 1.05, E.inOutSine(prog(u, 27, 31))) }, { rect: R.raiseBtn, amt: bump(u, 30.15, 0.32) });
  ctx.restore();
}

// ---------------------------------------------------------------- S4 + S5 validator, then one place   (u 31..53)
const SLOTS = [   // the row of four in shot 5: [img, cx, cy, w, roll, enter]
  ['home', 345, 450, 610, -2.2, 44.3],
  ['prd', 760, 418, 610, 1.2, 44.8],
  ['review', 1175, 462, 610, -1.0, 45.3],
  ['validator', 1590, 426, 610, 2.0, 0],
];
function sceneValidator(ctx, u, IMG, dx = 0) {
  const ex = E.inCubic(prog(u, 50.2, 52.6));   // everything falls back for the end card
  const orbit = -46 * E.inOutSine(prog(u, 45, 53));
  // other three panes fly in from depth, staggered
  SLOTS.slice(0, 3).forEach(([key, cx, cy, w, roll, enter], i) => {
    const k = springU(u, enter, { stiffness: 120, damping: 17 });
    if (k <= 0.001) return;
    const kk = clamp(k);
    pane(ctx, IMG[key], {
      cx: cx + orbit * (0.7 + i * 0.1), cy: cy + 160 * (1 - k) + 70 * ex, w: w * (0.55 + 0.45 * k) * (1 - 0.15 * ex),
      tilt: (10 + 30 * (1 - kk)) * DEG, roll: roll * DEG, alpha: kk * (1 - ex), blur: 18 * (1 - kk) + 22 * ex,
    });
  });
  // the validator screen: whip in, drift, dolly to the gate, press, then pull back into its slot
  const pb = E.inOutCubic(prog(u, 43.4, 45.8));
  const [, scx, scy, sw, sroll] = SLOTS[3];
  const drift = E.inOutSine(prog(u, 32, 38));
  const dol = E.inOutCubic(prog(u, 38, 41));
  const [gx, gy] = centre(R.valGate);
  const sIn = logZ(1, 1.13, drift) * logZ(1, 2.15, dol);
  const s = logZ(sIn, 1, pb);
  const fx = lerp(lerp(W / 2 + 150 * drift, gx, dol), W / 2, pb), fy = lerp(lerp(H / 2, gy, dol), H / 2, pb);
  ctx.save();
  ctx.translate(dx, 0);
  cam(ctx, s, fx, fy);
  const cx = lerp(PCX, scx + orbit, pb), cy = lerp(PCY, scy + 70 * ex, pb), w = lerp(PW, sw, pb) * (1 - 0.15 * ex);
  pane(ctx, IMG.validator, { cx, cy, w, tilt: 10 * DEG * pb, roll: sroll * DEG * pb, zoom: s, alpha: 1 - ex, blur: 22 * ex });
  // the approve press, on the real button, in place on the screen
  const pr = bump(u, 41.15, 0.32);
  if (pr > 0 && pb < 0.01) {
    const [bx, by] = onPane(R.valGate[0], R.valGate[1]);
    pressBtn(ctx, IMG.validator, R.valGate, R.approveBtn, pr, bx, by, SC);
  }
  ctx.restore();
  caption(ctx, u, [[['It'], ['stops']], [['where'], ['you']], [['decide.', true]]], { x: 120 + dx, y: 420, size: 96, lh: 104, u0: 33, step: 0.42, out: 37.2 });
  caption(ctx, u, [[['One'], ['place.', true]]], { x: 160, y: 930, size: 124, u0: 46.5, step: 0.6, dur: 2.8, out: 50.2, outDur: 1.4 });
}

// ---------------------------------------------------------------- S6 end card   (u 51.5..60)
function sceneEnd(ctx, u) {
  const k = springU(u, 51.7, { stiffness: 110, damping: 16 });
  if (k <= 0.001) return;
  const d = 204, mx = 160 + d / 2, my = 452;
  const blur = 30 * Math.max(0, 1 - k) ** 1.3;
  ctx.save();
  ctx.globalAlpha = clamp(k * 1.4);
  if (blur > 0.25) ctx.filter = `blur(${blur.toFixed(2)}px)`;
  const sc = 0.82 + 0.18 * k;
  ctx.translate(mx, my); ctx.scale(sc, sc); ctx.translate(-mx, -my);
  mark(ctx, mx, my, d, (u - 55.6) / 1.6);
  ctx.restore();
  // wordmark, per glyph
  const size = 176, f = font(size, 640, DISPLAY), track = -0.03 * size;
  const L = M.layout(ctx, 'AAVA 3.0', f, track);
  const x0 = 404, base = my + size * 0.36;
  L.glyphs.forEach((g, j) => {
    const s0 = 52.3 + j * 0.11;
    const kk = E.outCubic(prog(u, s0, s0 + 2.2));
    if (kk <= 0.002) return;
    const b = 22 * (1 - kk) ** 1.4;
    ctx.save();
    ctx.globalAlpha = kk;
    if (b > 0.25) ctx.filter = `blur(${b.toFixed(2)}px)`;
    M.glyph(ctx, g.ch, x0 + g.cx + 26 * (1 - kk), base, f, C.text);
    ctx.restore();
  });
  caption(ctx, u, [[['AAVA does the heavy lifting.']]], { x: 164, y: 700, size: 70, u0: 54, dur: 2.4, weight: 520, color: C.muted });
  caption(ctx, u, [[['You make the'], ['decisions.', true]]], { x: 164, y: 790, size: 70, u0: 54.9, step: 0.5, dur: 2.4, weight: 560 });
}

// ---------------------------------------------------------------- film

function grainTile() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const id = x.createImageData(256, 256); const r = mulberry32(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  x.putImageData(id, 0, 0); return c;
}

M.film({
  fonts: [font(100, 640, DISPLAY), font(40, 480, DISPLAY), font(30, 400, UI)],
  images: { homeF: 'assets/shots/home.png', reviewF: 'assets/shots/review.png', validatorF: 'assets/shots/validator.png', prdF: 'assets/shots/prd.png' },
  hits: HITS,
  samples: 10,
  init(ctx, IMG) {
    const half = (im) => {
      const c = document.createElement('canvas'); c.width = im.width / 2; c.height = im.height / 2;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height); return c;
    };
    for (const k of ['home', 'review', 'validator', 'prd']) IMG[k] = { full: IMG[k + 'F'], half: half(IMG[k + 'F']) };
    const scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H;
    const shadow = document.createElement('canvas'); shadow.width = 600; shadow.height = 400;
    const sx = shadow.getContext('2d'); sx.filter = 'blur(38px)'; sx.fillStyle = '#000'; sx.fillRect(80, 80, 440, 240);
    G = { scratch, sctx: scratch.getContext('2d'), shadow, grain: grainTile() };
  },
  draw(ctx, u, t, IMG) {
    ctx.imageSmoothingQuality = 'high';
    ambient(ctx, u, 1 + 0.45 * (1 - E.inOutSine(prog(u, 0, 8))) + 0.35 * E.outCubic(prog(u, 51, 54)));
    if (u < 8.6) sceneHeadline(ctx, u);
    if (u >= 5.2 && u < 20) sceneHome(ctx, u, IMG);
    const whip = E.inOutCubic(prog(u, 31.0, 32.2));
    if (u >= 20 && u < 32.3) sceneReview(ctx, u, IMG, -W * whip);
    if (u >= 31 && u < 53) sceneValidator(ctx, u, IMG, W * (1 - whip));
    if (u >= 51.5) sceneEnd(ctx, u);
  },
  post(ctx, u, t) {
    // a whisper of grain, after the blur accumulation so it isn't averaged away
    const fr = Math.floor(t * 60);
    ctx.globalAlpha = 0.035; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(hash01(fr, 3) * 256), oy = Math.floor(hash01(fr, 5) * 256);
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(G.grain, x, y);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  },
});
