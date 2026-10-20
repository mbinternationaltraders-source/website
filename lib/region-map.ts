// Regional dot map geometry, computed once per load from coarse outlines (decorative accuracy only).
// Shared by server and client: the canvas animates these dots; pins and labels sit in HTML/SVG on top.
type Pt = [number, number];

const PK: Pt[] = [
  [61.6, 25.1], [61.8, 26.2], [63.2, 26.6], [63.3, 27.2], [62.8, 27.4], [62.8, 28.3], [61.9, 28.6], [61.5, 29.4],
  [62.5, 29.4], [64.1, 29.5], [66.3, 29.9], [66.6, 31.0], [67.7, 31.4], [68.8, 31.6], [69.3, 31.9], [69.5, 33.1],
  [70.3, 33.4], [69.9, 34.0], [71.1, 34.4], [71.2, 34.8], [71.6, 35.3], [71.4, 35.8], [71.8, 36.5], [72.6, 36.8],
  [73.9, 36.9], [74.6, 37.0], [75.2, 36.9], [75.9, 36.5], [76.4, 35.8], [75.9, 35.4], [75.2, 35.0], [74.4, 34.7],
  [74.0, 34.1], [74.3, 33.4], [74.1, 32.9], [74.6, 32.5], [74.6, 31.9], [74.6, 31.1], [74.0, 30.5], [73.4, 29.9],
  [72.9, 29.0], [71.9, 27.9], [70.7, 27.7], [70.1, 27.2], [69.6, 26.6], [70.2, 25.8], [70.0, 25.4], [69.4, 24.5],
  [68.8, 24.2], [67.4, 24.0], [67.0, 24.8], [66.6, 25.4], [65.0, 25.3], [64.0, 25.2], [62.5, 25.1],
];
// Afghanistan: Iran border, northern border and Wakhan, then Pakistan's north-west border in reverse.
const AF: Pt[] = [
  [61.5, 29.4], [60.9, 29.9], [61.7, 30.9], [61.8, 31.3], [60.9, 31.5], [60.6, 33.1], [60.9, 34.3], [61.3, 35.6],
  [62.3, 35.3], [63.1, 35.9], [64.5, 36.3], [65.6, 37.4], [66.6, 37.4], [67.8, 37.2], [69.3, 37.1], [70.2, 37.6],
  [70.9, 38.4], [71.5, 38.0], [71.4, 37.1], [72.6, 37.0], [73.6, 37.4], [74.9, 37.2], [74.6, 37.0],
  [73.9, 36.9], [72.6, 36.8], [71.8, 36.5], [71.4, 35.8], [71.6, 35.3], [71.2, 34.8], [71.1, 34.4], [69.9, 34.0],
  [70.3, 33.4], [69.5, 33.1], [69.3, 31.9], [68.8, 31.6], [67.7, 31.4], [66.6, 31.0], [66.3, 29.9], [64.1, 29.5],
  [62.5, 29.4],
];
// Gulf of Oman and Arabian Sea inside the frame (left empty).
const SEA: Pt[] = [
  [56.9, 25.75], [57.8, 25.6], [59.0, 25.4], [60.6, 25.3], [61.6, 25.1], [62.5, 25.1], [64.0, 25.2], [65.0, 25.3],
  [66.6, 25.4], [67.0, 24.8], [67.4, 24.0], [68.6, 23.9], [68.6, 23.3], [69.5, 22.8], [70.4, 22.9], [70.0, 22.4],
  [69.1, 22.3], [69.6, 21.6], [70.3, 20.9], [59.4, 20.9], [59.8, 22.5], [58.6, 23.6], [56.9, 23.95],
];

const LON0 = 57, LON1 = 82, LAT0 = 21, LAT1 = 40, STEP = 0.42;
const KX = Math.cos((30.5 * Math.PI) / 180); // equirectangular squash at the frame's mid latitude
const W = (LON1 - LON0) * KX, H = LAT1 - LAT0;
export const VB_W = 1000;
export const VB_H = Math.round((VB_W * H) / W);
export const px = (lon: number) => ((lon - LON0) * KX * 100) / W; // % of width
export const py = (lat: number) => ((LAT1 - lat) * 100) / H; // % of height
export const sx = (lon: number) => Math.round(((lon - LON0) * KX * VB_W) / W);
export const sy = (lat: number) => Math.round(((LAT1 - lat) * VB_W) / W);

function inside(poly: Pt[], lon: number, lat: number) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

type Country = "pk" | "af" | "ir" | "ca" | "cn" | "in" | null;
function countryAt(lon: number, lat: number): Country {
  if (inside(SEA, lon, lat)) return null;
  if (inside(PK, lon, lat)) return "pk";
  if (inside(AF, lon, lat)) return "af";
  if (lat > 35.4 && lon < 74.8 && (lon > 60.5 || lat > 37.2)) return "ca";
  if (lon < 63.5) return "ir";
  if (lon >= 74.8 && lat >= 35.3) return "cn";
  return "in";
}

const HOME = { lon: 74.19, lat: 32.16 }; // Gujranwala
export const dist = (lon: number, lat: number) => Math.hypot((lon - HOME.lon) * KX, lat - HOME.lat);
const jitter = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

/** kind: 0 neighbour, 1 Pakistan, 2 Gujranwala (home). d: reveal delay in ms. */
export type Dot = { x: number; y: number; kind: 0 | 1 | 2; d: number };
export const WAVE_MS = 1700; // the ripple crosses the whole region in this time

function build() {
  const cols = Math.floor((LON1 - LON0) / STEP), rows = Math.floor((LAT1 - LAT0) / STEP);
  const grid: Country[][] = Array.from({ length: cols + 1 }, (_, i) =>
    Array.from({ length: rows + 1 }, (_, j) => countryAt(LON0 + i * STEP, LAT0 + j * STEP)),
  );
  const raw: { lon: number; lat: number; kind: 0 | 1 | 2 }[] = [];
  for (let i = 0; i <= cols; i++)
    for (let j = 0; j <= rows; j++) {
      const c = grid[i][j];
      if (!c) continue;
      const lon = LON0 + i * STEP, lat = LAT0 + j * STEP;
      if (c !== "pk") {
        // One-dot gap: drop neighbour dots touching Pakistan, and one side of every other border.
        let gap = false;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const n = grid[i + di]?.[j + dj];
          if (n === "pk" || (n && n !== c && n < c && Math.abs(di) + Math.abs(dj) === 1)) gap = true;
        }
        if (gap) continue;
      }
      raw.push({ lon, lat, kind: c === "pk" ? (dist(lon, lat) < 0.6 ? 2 : 1) : 0 });
    }
  const far = Math.max(...raw.map((r) => dist(r.lon, r.lat)));
  return raw.map((r, n): Dot => ({
    x: sx(r.lon), y: sy(r.lat), kind: r.kind,
    d: Math.round((dist(r.lon, r.lat) / far) * WAVE_MS + jitter(n) * 180),
  }));
}
export const dots = build();
export const PINS_START = WAVE_MS + 500;

export const LABELS: [string, number, number][] = [
  ["IRAN", 58.9, 31.6], ["AFGHANISTAN", 65.6, 34.4], ["INDIA", 77.3, 26.8], ["CHINA", 79.6, 37.6], ["ARABIAN SEA", 63.6, 22.6],
];
