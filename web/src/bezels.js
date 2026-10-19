// bezels.js — a case round the dial, on the preview only (4.66). The idea is farukahmet's PR #3 (18 Oct 2026); Okay,
// 21:20: "Bezel had a very positive effect on people … 'abstractify' a few bezels … maybe just silhouettes of classics."
//
// Redrawn in 4.82 (Okay, 19 Oct 2026, 01:26: "Case illustrations awesome, but need better proportions. Silhouette nearly
// identical to known watches, real lug widths etc in relation to the dial size. Detail level perfect, less
// illustrationy, more technical drawingy. … bracelet needs to look as if loop closed"). Each case is now a drawing
// of its kind as a watch is drawn in a technical sheet, seen from above: flat fills, an ink outline round every part
// and finer lines for the edges inside a part (a bezel's step, a lug's chamfer, a crown's knurl, a strap's stitching),
// the spring bars as hidden lines (dashed). Its measures are the kinds' own, as a share of the case's diameter
// (OD) — from real cases (19 Oct 2026; Aquastar's and Lucius Atelier's proportion guides): the strap between the lugs
// half the case (20 mm on a 40 mm case), lug tip to lug tip 1.16–1.22 times it, a diver's bezel opening about three
// quarters of it. The case's diameter itself is the dial's times the kind's `od`. Kinds, not models: no maker's case.
//
// Millimetres, y up, the dial's centre at the origin — the dial's own space (R1, R2). Never in an export (R5, R26):
// app.js draws it under the dial. A case is a list of parts in drawing order, each a path with a fill (or none) and
// a line: OUT (the outline, 1 screen point), FINE (an edge inside, 0.6) or HIDDEN (dashed, 0.6); lines keep their
// width at every zoom (non-scaling strokes), as a drawing's pen does.
//
// Its strap (4.69; Okay, 22:35: "Add straps to bezels metal bands too … Add strap color change option"): a leather
// strap in the strap's colour, stitched along both edges, the buckle and its two keepers on the 12 side, the holes and
// the rounded tip on the 6 side; or a three-link bracelet in the case's metal whose ends are finished — the folding
// clasp at the 6 end, the clasp's tongue at the 12 end — so it reads as one closed loop (01:26).

export const BEZELS = ["None", "Diver", "Pilot", "Dress", "Sport", "Pixel Watch"];
export const STRAPS = ["None", "Strap", "Bracelet"];

// the tones: steel for all but the dress case, which is gold; a polished part a little lighter; a diver's or sport
// bezel's insert and its marks; the ink every line is drawn in
const STEEL = { body: "#C9C9C4", polish: "#E2E2DD", under: "#8E8E89", insert: "#1A1A1A", mark: "#ECEAE3" };
const GOLD = { body: "#D3B978", polish: "#E8D7A6", under: "#9C8346", insert: "#1A1A1A", mark: "#ECEAE3" };
const INK = "#1C1C1C";
// a kind's measures, as shares of the case's diameter (OD) but od (the case's diameter over the dial's): strap — the
// room between the lugs; l2l — lug tip to lug tip; lug — one lug's width at its tip; flare — how much wider it is
// where it leaves the case; crown — how far it stands out and how tall it is; bezel — the opening's ring (insert or
// step) as a share of the room between the dial and the case's edge
const KINDS = {
  Diver: { od: 1.36, strap: 0.5, l2l: 1.18, lug: 0.1, flare: 0.25, crown: [0.075, 0.18], guards: true, insert: true },
  Pilot: { od: 1.14, strap: 0.5, l2l: 1.22, lug: 0.085, flare: 0.2, crown: [0.1, 0.22], onion: true },
  Dress: { od: 1.1, strap: 0.5, l2l: 1.16, lug: 0.065, flare: 0.45, crown: [0.055, 0.12] },
  Sport: { od: 1.3, strap: 0.5, l2l: 1.17, lug: 0.1, flare: 0.2, crown: [0.065, 0.15], pushers: true, tachy: true },
  "Pixel Watch": { od: 1.31, strap: 0.5, l2l: 1.16, lug: 0.08, flare: 0.1, crown: [0.05, 0.16] },
};

const f = (v) => (+v).toFixed(3);
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (c, to, k) => c.slice(0, 3).map((v) => v + (to - v) * k);
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const poly = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
const line = (pts) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}`;
const pt = (r, a) => [r * Math.sin(a * Math.PI / 180), r * Math.cos(a * Math.PI / 180)];      // clock degrees, y up
const circle = (r, cx = 0, cy = 0) => `M${f(cx - r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)}A${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)}Z`;
const ring = (r0, r1) => circle(r1) + circle(r0);                    // evenodd: the band between
const rrect = (x, y, w, h, r) => {                                   // a box with round corners, x y its lower left
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)} ${f(y)}H${f(x + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)}H${f(x + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}Z`;
};
// a mark standing on the clock, from r0 out to r1, w wide, at clock angle a
const bar = (r0, r1, w, a) => {
  const [sx, sy] = pt(1, a), nx = sy, ny = -sx, p = (r, s) => [r * sx + s * nx * w / 2, r * sy + s * ny * w / 2];
  return poly([p(r0, -1), p(r1, -1), p(r1, 1), p(r0, 1)]);
};
const tick = (r0, r1, a) => line([pt(r0, a), pt(r1, a)]);
// the three pens
const OUT = { sw: 1 }, FINE = { sw: 0.6 }, HIDDEN = { sw: 0.6, dash: true };

/** a strap or bracelet, both ends, between the lugs: from y0 (under the case) outward; W wide at the lugs, narrowing to
 *  four fifths; sb the spring bars' height. Parts in drawing order, before the lugs and the case. */
function strap_parts(kind, OD, y0, W, sb, metal, colour, add) {
  const taper = (y) => W * (1 - 0.2 * Math.min(Math.max((Math.abs(y) - y0) / (OD * 1.8), 0), 1)) / 2;      // the half width at height y (either end)
  const span = (ya, yb, s0 = -1, s1 = 1) => poly([[s0 * taper(ya), ya], [s1 * taper(ya), ya], [s1 * taper(yb), yb], [s0 * taper(yb), yb]]);
  const top = y0 + OD * 1.35, bottom = -(y0 + OD * 1.95);      // where each end stops: the 6 side the longer (it carries the holes)
  if (kind === 1) {
    const body = hex(colour), stitch = hex(lum(colour) > 0.45 ? mix(colour, 0, 0.45) : mix(colour, 1, 0.55)), hole = hex(mix(colour, 0, 0.5));
    // the 12 side: straight out to the buckle
    add(span(y0, top), body, OUT);
    // the 6 side: out to a rounded tip
    const tw = taper(bottom);
    add(span(-y0, bottom) .replace(/Z$/, "") + "Z", body, OUT);
    add(`M${f(-tw)} ${f(bottom)}A${f(tw)} ${f(tw)} 0 0 0 ${f(tw)} ${f(bottom)}Z`, body, OUT);
    // its stitching: a dashed line along each edge, a twelfth of the width in
    for (const [ya, yb] of [[sb + OD * 0.03, top - OD * 0.05], [-sb - OD * 0.03, bottom + OD * 0.02]]) for (const s of [-1, 1]) {
      const k = 1 - 0.16;
      add(line([[s * k * taper(ya), ya], [s * k * taper(yb), yb]]), "none", { sw: 0.6, dash: true, colour: stitch });
    }
    // five holes towards the tip, the middle one worn
    for (let h = 0; h < 5; h++) { const y = bottom + OD * (0.22 + 0.11 * h); add(circle(OD * 0.016, 0, y), hole, FINE); }
    // the buckle at the 12 end: its frame and the tongue lying down the strap's middle; two keepers just under it
    const bw = taper(top) + OD * 0.025, bh = OD * 0.16, t = OD * 0.028;
    add(rrect(-bw, top - bh / 2, 2 * bw, bh, OD * 0.03) + rrect(-bw + t, top - bh / 2 + t, 2 * (bw - t), bh - 2 * t, OD * 0.012), metal.body, OUT, "evenodd");
    add(rrect(-OD * 0.008, top - bh * 0.62, OD * 0.016, bh * 0.62 + t * 0.5, OD * 0.008), metal.polish, FINE);
    for (const k of [0.16, 0.3]) { const y = top - OD * k, kw = taper(y) + OD * 0.012; add(rrect(-kw, y - OD * 0.035, 2 * kw, OD * 0.035, OD * 0.006), body, OUT); }
  } else {
    // a three-link bracelet: rows of an outer link either side and a polished middle one, every part outlined
    const pitch = OD * 0.11, rows = (from, to, way) => {
      for (let y = from; way > 0 ? y < to : y > to; y += way * pitch) {
        const ya = y, yb = y + way * Math.min(pitch, Math.abs(to - y));
        add(span(ya, yb, -1, -0.34), metal.body, OUT);
        add(span(ya, yb, -0.34, 0.34), metal.polish, OUT);
        add(span(ya, yb, 0.34, 1), metal.body, OUT);
      }
    };
    rows(y0, top - OD * 0.12, 1);
    rows(-y0, bottom + OD * 0.42, -1);
    // its ends, finished, as the two halves of one clasp: at 12 the tongue that goes into it (a link with a round end);
    // at 6 the folding clasp itself (a long plate over the links, its cover's edge and the hinge's line)
    const yt = top - OD * 0.12, tw = taper(yt) * 0.86;
    add(`M${f(-tw)} ${f(yt)}H${f(tw)}V${f(top - tw * 0.6)}A${f(tw)} ${f(tw * 0.6)} 0 0 1 ${f(-tw)} ${f(top - tw * 0.6)}Z`, metal.body, OUT);
    add(line([[-tw * 0.55, yt + OD * 0.03], [tw * 0.55, yt + OD * 0.03]]), "none", FINE);
    const yc = bottom + OD * 0.42, cw = taper(yc), r = cw * 0.5;
    add(`M${f(-cw)} ${f(yc)}H${f(cw)}V${f(bottom + r)}A${f(cw)} ${f(r)} 0 0 1 ${f(-cw)} ${f(bottom + r)}Z`, metal.body, OUT);
    add(`M${f(-cw * 0.78)} ${f(yc - OD * 0.04)}H${f(cw * 0.78)}V${f(bottom + r + OD * 0.03)}A${f(cw * 0.78)} ${f(r * 0.8)} 0 0 1 ${f(-cw * 0.78)} ${f(bottom + r + OD * 0.03)}Z`, metal.polish, FINE);
    add(line([[-cw, yc - OD * 0.015], [cw, yc - OD * 0.015]]), "none", FINE);
  }
}

/** the parts of a case for a dial of diameter d (mm), style i (BEZELS), with its strap (STRAPS: 0 none · 1 strap · 2
 *  bracelet; the strap in `colour`, R G B A from 0 to 1) → {parts: [{d, fill, rule, sw, dash, colour}] in drawing
 *  order, reach: how far the case reaches from the centre}. */
export function bezel_parts(i, d, strap = 0, colour = [0.29, 0.2, 0.14, 1]) {
  const R = d / 2, name = BEZELS[i];
  if (!name || name === "None") return { parts: [], reach: R };
  if (name === "Pixel Watch") {
    const Rc = R * 1.156;
    const reach = strap ? R * 1.95 : R * 1.35;
    const parts = [
      { d: circle(Rc), fill: "#141517", rule: "nonzero", sw: 1, dash: false, colour: INK },
    ];
    if (strap === 1) {
      parts.push({ d: `M${f(-0.8 * R)} ${f(-1.89 * R)}L${f(0.8 * R)} ${f(-1.89 * R)}L${f(0.8 * R)} ${f(1.89 * R)}L${f(-0.8 * R)} ${f(1.89 * R)}Z`, fill: hex(colour), rule: "nonzero", sw: 0, dash: false, colour: INK });
    } else if (strap === 2) {
      parts.push({ d: `M${f(-0.72 * R)} ${f(-1.95 * R)}L${f(0.72 * R)} ${f(-1.95 * R)}L${f(0.72 * R)} ${f(1.95 * R)}L${f(-0.72 * R)} ${f(1.95 * R)}Z`, fill: STEEL.body, rule: "nonzero", sw: 0, dash: false, colour: INK });
    }
    return { parts, reach };
  }
  const K = KINDS[name], T = name === "Dress" ? GOLD : STEEL;
  const OD = d * K.od, Rc = OD / 2, W = OD * K.strap, lw = OD * K.lug, tip = OD * K.l2l / 2;
  const parts = [], add = (path, fill, pen = null, rule = "nonzero") => parts.push({ d: path, fill, rule, sw: pen ? pen.sw : 0, dash: Boolean(pen && pen.dash), colour: pen && pen.colour || INK });
  const sb = tip - OD * 0.035;                                       // the spring bars, a little in from the lugs' tips
  // the strap first, under everything, from under the case
  if (strap) strap_parts(strap, OD, Rc * 0.8, W, sb, T, colour, add);
  // the four lugs: the inner edge straight along the strap, the outer edge flaring as it runs into the case, the tip's
  // corners rounded; a chamfer's line along the outer edge (the polished bevel most cases have there)
  const xi = W / 2, xo = W / 2 + lw, xr = xo + lw * K.flare, y_root = Math.sqrt(Math.max(Rc * Rc - xr * xr, 0)) - OD * 0.02, cr = lw * 0.35;
  for (const sy of [1, -1]) for (const sx of [1, -1]) {
    const P = ([x, y]) => [sx * x, sy * y];
    const pts = [[xi, Rc * 0.7], [xi, tip], [xo - cr, tip], [xo, tip - cr], [xr, y_root]].map(P);
    const [a, b, c, e, g] = pts, sweep = sx * sy > 0 ? 0 : 1;
    add(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}A${f(cr)} ${f(cr)} 0 0 ${sweep} ${f(e[0])} ${f(e[1])}Q${f(sx * (xo + lw * K.flare * 0.15))} ${f(sy * (tip + y_root) / 2)} ${f(g[0])} ${f(g[1])}Z`, T.body, OUT);
    const k = 0.32;      // the chamfer: this share of the lug in from its outer edge
    add(line([P([xo - lw * k, tip - cr * 0.6]), P([xr - lw * k, y_root + OD * 0.01])]), "none", FINE);
  }
  // the spring bars: hidden lines across, under the strap's end
  for (const sy of [1, -1]) add(line([[-xo + lw * 0.5, sy * sb], [xo - lw * 0.5, sy * sb]]), "none", HIDDEN);
  // the crown at 3 (and its tube), under the case; a diver's guards either side of it; a chronograph's pushers at 2 and 4
  const [cw, ch] = K.crown.map((k) => k * OD), cx = Rc - OD * 0.008;
  add(rrect(cx - OD * 0.01, -ch * 0.28, OD * 0.03, ch * 0.56, 0), T.body, OUT);      // the tube
  const c0 = cx + OD * 0.018;
  if (K.onion) {
    // an onion crown: three swellings along it
    const n = 3, step = cw / n;
    let p = `M${f(c0)} ${f(-ch * 0.32)}`;
    for (let k = 0; k < n; k++) p += `Q${f(c0 + step * (k + 0.5))} ${f(-ch / 2)} ${f(c0 + step * (k + 1))} ${f(-ch * 0.32)}`;
    p += `V${f(ch * 0.32)}`;
    for (let k = n; k > 0; k--) p += `Q${f(c0 + step * (k - 0.5))} ${f(ch / 2)} ${f(c0 + step * (k - 1))} ${f(ch * 0.32)}`;
    add(p + "Z", T.body, OUT);
    for (let k = 1; k < n; k++) add(line([[c0 + step * k, -ch * 0.32], [c0 + step * k, ch * 0.32]]), "none", FINE);
  } else {
    add(rrect(c0, -ch / 2, cw, ch, OD * 0.008), T.body, OUT);
    for (let k = 1; k < 8; k++) add(line([[c0 + cw * 0.18, -ch / 2 + ch * k / 8], [c0 + cw, -ch / 2 + ch * k / 8]]), "none", FINE);      // the knurl, seen from above: grooves along it
  }
  if (K.guards) for (const s of [1, -1]) {
    // a shoulder rising out of the case's side to half the crown's length, its end square to the crown
    const y0 = s * (ch / 2 + OD * 0.008), y1 = s * (ch / 2 + OD * 0.07), xg = c0 + cw * 0.5, ya = s * (ch / 2 + OD * 0.16);
    add(`M${f(Rc * 0.9)} ${f(y0)}L${f(xg)} ${f(y0)}L${f(xg)} ${f(y1)}Q${f(Rc + OD * 0.01)} ${f(y1 + s * OD * 0.02)} ${f(Math.sqrt(Math.max(Rc * Rc - ya * ya, 0)) - OD * 0.01)} ${f(ya)}Z`, T.body, OUT);
  }
  if (K.pushers) for (const a of [60, 120]) {
    add(bar(Rc - OD * 0.01, Rc + OD * 0.025, OD * 0.04, a), T.body, OUT);      // its tube
    add(bar(Rc + OD * 0.02, Rc + OD * 0.075, OD * 0.075, a), T.body, OUT);
  }
  // the case: its body, then the bezel's edges
  add(circle(Rc), T.body, OUT);
  if (K.insert) {
    // a turning bezel: its edge's grips (short lines round the rim), the insert, a triangle at 12, a bar every five
    // minutes and minute marks for the first fifteen
    const ro = Rc - OD * 0.035, ri = R * 1.02;
    for (let k = 0; k < 120; k++) add(tick(Rc - OD * 0.022, Rc, k * 3), "none", FINE);
    add(circle(ro), "none", FINE);
    add(ring(ri, ro), T.insert, OUT, "evenodd");
    const mid = (ri + ro) / 2, h = (ro - ri) * 0.6;
    add(poly([pt(mid + h / 2, 0), [h * 0.5, mid - h / 2], [-h * 0.5, mid - h / 2]]), T.mark, null);
    for (let k = 1; k < 12; k++) add(bar(mid - h / 2, mid + h / 2, OD * 0.012, k * 30), T.mark, null);
    for (let k = 1; k < 15; k++) if (k % 5) add(bar(mid + h * 0.1, mid + h / 2, OD * 0.004, k * 6), T.mark, null);
  } else if (K.tachy) {
    // a flat bezel with sixty marks, the fifth ones longer (a tachymeter's rhythm without its words)
    const ro = Rc - OD * 0.02, ri = R * 1.03;
    add(ring(ri, ro), T.insert, OUT, "evenodd");
    for (let k = 0; k < 60; k++) add(bar(ro - (k % 5 ? OD * 0.018 : OD * 0.035), ro - OD * 0.006, OD * 0.0045, k * 6), T.mark, null);
  } else {
    // a plain bezel: its step (a pilot's wide, a dress case's narrow) and the opening's edge
    add(circle(R + (Rc - R) * (K.onion ? 0.55 : 0.4)), "none", FINE);
    add(circle(R * 1.006), "none", OUT);
  }
  const reach = Math.max(Rc + cw + OD * 0.03, tip);
  return { parts, reach };
}

function pixel_watch_back_svg(d, strap, colour) {
  const R = d / 2;
  const c = colour || [0.14, 0.14, 0.15, 1];
  const bandBase = hex(c);
  const bandLight = hex(mix(c, 1, 0.22));
  const bandMid = hex(mix(c, 1, 0.08));
  const bandDark = hex(mix(c, 0, 0.32));
  const bandDeep = hex(mix(c, 0, 0.60));

  const topBandD = "M -0.80 -0.84 C -0.63 -1.10 -0.56 -1.36 -0.54 -1.73 Q -0.53 -1.87 -0.39 -1.89 Q 0 -1.93 0.39 -1.89 Q 0.53 -1.87 0.54 -1.73 C 0.56 -1.36 0.63 -1.10 0.80 -0.84 Z";
  const botBandD = "M -0.80 0.84 C -0.63 1.10 -0.56 1.36 -0.54 1.73 Q -0.53 1.87 -0.39 1.89 Q 0 1.93 0.39 1.89 Q 0.53 1.87 0.54 1.73 C 0.56 1.36 0.63 1.10 0.80 0.84 Z";

  const crownRibs = Array.from({ length: 13 }, (_, idx) => {
    const y = (-0.126 + idx * 0.021).toFixed(4);
    const yHi = (-0.126 + idx * 0.021 + 0.006).toFixed(4);
    return `<line x1="1.180" y1="${y}" x2="1.268" y2="${y}" stroke="#0c0d0f" stroke-width="0.009" stroke-linecap="round"/>` +
           `<line x1="1.182" y1="${yHi}" x2="1.266" y2="${yHi}" stroke="rgba(255,255,255,0.34)" stroke-width="0.004" stroke-linecap="round"/>`;
  }).join("");

  let strapContent = "";
  if (strap === 1) {
    strapContent = `
      <path d="${topBandD}" fill="url(#pw-band-h)"/>
      <path d="${topBandD}" fill="url(#pw-band-v-top)"/>
      <path d="${botBandD}" fill="url(#pw-band-h)"/>
      <path d="${botBandD}" fill="url(#pw-band-v-bot)"/>
    `;
  } else if (strap === 2) {
    const rows = [];
    for (let y = 0.84; y < 1.85; y += 0.11) {
      const ya = y.toFixed(3), yb = (y + 0.10).toFixed(3);
      rows.push(`<path d="M -0.70 ${ya} L 0.70 ${ya} L 0.68 ${yb} L -0.68 ${yb} Z" fill="#C9C9C4" stroke="#1C1C1C" stroke-width="0.006"/>`);
      rows.push(`<path d="M -0.24 ${ya} L 0.24 ${ya} L 0.24 ${yb} L -0.24 ${yb} Z" fill="#E2E2DD" stroke="#1C1C1C" stroke-width="0.006"/>`);
    }
    for (let y = -0.84; y > -1.85; y -= 0.11) {
      const ya = y.toFixed(3), yb = (y - 0.10).toFixed(3);
      rows.push(`<path d="M -0.70 ${ya} L 0.70 ${ya} L 0.68 ${yb} L -0.68 ${yb} Z" fill="#C9C9C4" stroke="#1C1C1C" stroke-width="0.006"/>`);
      rows.push(`<path d="M -0.24 ${ya} L 0.24 ${ya} L 0.24 ${yb} L -0.24 ${yb} Z" fill="#E2E2DD" stroke="#1C1C1C" stroke-width="0.006"/>`);
    }
    strapContent = rows.join("");
  }

  return `
    <g class="pw-case-back" transform="scale(${f(R)} ${f(-R)})">
      <defs>
        <linearGradient id="pw-case-edge" gradientUnits="userSpaceOnUse" x1="-0.25" y1="-1.16" x2="0.25" y2="1.16">
          <stop offset="0%" stop-color="#dcdddf"/>
          <stop offset="18%" stop-color="#8a8c90"/>
          <stop offset="48%" stop-color="#343638"/>
          <stop offset="78%" stop-color="#828488"/>
          <stop offset="100%" stop-color="#d4d6d9"/>
        </linearGradient>
        <linearGradient id="pw-band-h" gradientUnits="userSpaceOnUse" x1="-0.72" y1="0" x2="0.72" y2="0">
          <stop offset="0%" stop-color="${bandMid}"/>
          <stop offset="28%" stop-color="${bandLight}"/>
          <stop offset="54%" stop-color="${bandBase}"/>
          <stop offset="82%" stop-color="${bandDark}"/>
          <stop offset="100%" stop-color="${bandDeep}"/>
        </linearGradient>
        <linearGradient id="pw-band-v-top" gradientUnits="userSpaceOnUse" x1="0" y1="-1.92" x2="0" y2="-0.90">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.46"/>
          <stop offset="9%" stop-color="#ffffff" stop-opacity="0.08"/>
          <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
        </linearGradient>
        <linearGradient id="pw-band-v-bot" gradientUnits="userSpaceOnUse" x1="0" y1="0.90" x2="0" y2="1.92">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.45"/>
          <stop offset="30%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="91%" stop-color="#ffffff" stop-opacity="0.06"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.50"/>
        </linearGradient>
        <linearGradient id="pw-crown-grad" gradientUnits="userSpaceOnUse" x1="1.16" y1="-0.16" x2="1.27" y2="0.16">
          <stop offset="0%" stop-color="#1d1e20"/>
          <stop offset="20%" stop-color="#76787c"/>
          <stop offset="42%" stop-color="#2f3134"/>
          <stop offset="70%" stop-color="#111214"/>
          <stop offset="88%" stop-color="#4e5054"/>
          <stop offset="100%" stop-color="#141517"/>
        </linearGradient>
      </defs>
      ${strapContent}
      <path d="M 0.91 -0.70 A 1.166 1.166 0 0 1 1.11 -0.34" fill="none" stroke="#4a4c50" stroke-width="0.034" stroke-linecap="round"/>
      <path d="M 0.92 -0.69 A 1.172 1.172 0 0 1 1.11 -0.35" fill="none" stroke="rgba(255,255,255,0.52)" stroke-width="0.008" stroke-linecap="round"/>
      <rect x="1.14" y="-0.055" width="0.04" height="0.11" fill="#141517"/>
      <rect x="1.170" y="-0.158" width="0.106" height="0.316" rx="0.044" fill="url(#pw-crown-grad)" stroke="#222428" stroke-width="0.005"/>
      ${crownRibs}
      <circle cx="0" cy="0" r="1.160" fill="url(#pw-case-edge)"/>
      <circle cx="0" cy="0" r="1.146" fill="#000000"/>
    </g>
  `;
}

function pixel_watch_front_svg(d) {
  const R = d / 2;
  const bezelRingD = "M 0 -1.152 A 1.152 1.152 0 1 1 0 1.152 A 1.152 1.152 0 1 1 0 -1.152 Z M 0 -0.997 A 0.997 0.997 0 1 0 0 0.997 A 0.997 0.997 0 1 0 0 -0.997 Z";
  const topLeftDomeD = "M -1.02 0.37 A 1.086 1.086 0 0 1 0.37 -1.02 Q 0.41 -0.95 0.33 -0.89 A 1.40 1.40 0 0 0 -0.89 0.33 Q -0.95 0.41 -1.02 0.37 Z";
  const topLeftRimD = "M -1.04 0.30 A 1.088 1.088 0 0 1 0.30 -1.04 A 1.18 1.18 0 0 0 -1.04 0.30 Z";
  const botRightDomeD = "M -0.55 0.95 A 1.098 1.098 0 0 0 1.07 0.23 A 1.52 1.52 0 0 1 -0.55 0.95 Z";
  const botRightRimD = "M -0.55 0.95 A 1.098 1.098 0 0 0 1.07 0.23";

  return `
    <g class="pw-case-front" transform="scale(${f(R)} ${f(-R)})">
      <defs>
        <filter id="pw-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.015"/>
        </filter>
        <filter id="pw-rim-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.007"/>
        </filter>
        <clipPath id="pw-dome-clip"><circle cx="0" cy="0" r="1.156"/></clipPath>
        <linearGradient id="pw-dome-sheen" gradientUnits="userSpaceOnUse" x1="-0.82" y1="-0.82" x2="-0.22" y2="-0.22">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.56"/>
          <stop offset="36%" stop-color="#ffffff" stop-opacity="0.32"/>
          <stop offset="75%" stop-color="#ffffff" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
        </linearGradient>
        <linearGradient id="pw-bot-dome" gradientUnits="userSpaceOnUse" x1="0.72" y1="0.82" x2="0.20" y2="0.32">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/>
          <stop offset="42%" stop-color="#ffffff" stop-opacity="0.22"/>
          <stop offset="80%" stop-color="#ffffff" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="pw-bot-rim" gradientUnits="userSpaceOnUse" x1="0.80" y1="0.78" x2="-0.35" y2="0.98">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.52"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.12"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#pw-dome-clip)">
        <path d="${bezelRingD}" fill="#000000" fill-rule="evenodd"/>
        <path d="${topLeftDomeD}" fill="url(#pw-dome-sheen)" filter="url(#pw-soft-glow)"/>
        <path d="${topLeftRimD}" fill="rgba(255,255,255,0.28)" filter="url(#pw-soft-glow)"/>
        <path d="${botRightDomeD}" fill="url(#pw-bot-dome)" filter="url(#pw-soft-glow)"/>
        <path d="${botRightRimD}" fill="none" stroke="url(#pw-bot-rim)" stroke-width="0.022" stroke-linecap="round" filter="url(#pw-rim-blur)"/>
        <circle cx="0" cy="0" r="1.150" fill="none" stroke="url(#pw-case-edge)" stroke-width="0.015" opacity="0.95"/>
      </g>
    </g>
  `;
}

/** a case (and its strap) as SVG markup in the dial's space; its lines a pen's, the same width at every zoom. */
export function bezel_svg(i, d, strap = 0, colour) {
  const name = BEZELS[i];
  if (name === "Pixel Watch") return pixel_watch_back_svg(d, strap, colour);
  const dash = [4, 3];      // a pen's dashes: screen points, as the lines' widths (a non-scaling stroke dashes in the screen's space)
  return bezel_parts(i, d, strap, colour).parts.map((p) => `<path d="${p.d}" fill="${p.fill}"${p.rule === "evenodd" ? ' fill-rule="evenodd"' : ""}`
    + (p.sw ? ` stroke="${p.colour}" stroke-width="${p.sw}" vector-effect="non-scaling-stroke" stroke-linejoin="round"${p.dash ? ` stroke-dasharray="${dash.join(" ")}"` : ""}` : "") + "/>").join("");
}

/** the front glass overlay (e.g. Pixel Watch dome reflections and bezel ring), over the dial. */
export function bezel_front_svg(i, d) {
  const name = BEZELS[i];
  if (name === "Pixel Watch") return pixel_watch_front_svg(d);
  return "";
}

