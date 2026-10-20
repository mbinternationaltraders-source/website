// Owner-supplied product photography. Files live in /public/images/products/<slug>/<n>-<width>.webp.
export type Photo = { base: string; alt: string; studio: boolean };
// Bump when photos are replaced in place, so browsers drop cached copies of the old files.
const PHOTO_VERSION = "2026-10-20b";
export const photoSrc = (p: Photo, w: number) => `${p.base}-${w}.webp?v=${PHOTO_VERSION}`;

const set = (slug: string, shots: [alt: string, studio?: boolean][]): Photo[] =>
  shots.map(([alt, studio = true], i) => ({
    base: `/images/products/${slug}/${i + 1}`,
    alt,
    studio,
  }));

export const photoWidths = [400, 800, 1100] as const;

const photos: Record<string, Photo[]> = {
  "water-cooler-pump-lh1020": set("water-cooler-pump-lh1020", [
    ["LH1020 water cooler pump in black and orange, three-quarter view"],
    ["LH1020 pump from the cable side, showing the suction feet"],
    ["Close-up of the LH1020 hose outlet"],
    ["LH1020 pump on its CSG retail box", false],
  ]),
  "mini-fan-motor-dc-geared": set("mini-fan-motor-dc-geared", [
    ["12 V DC geared motor with white gearbox and output shaft", false],
    ["Label detail of the 12 V DC geared motor", false],
    ["Gearbox flange and steel output shaft of the DC geared motor", false],
  ]),
  "mini-fan-motor-ac-synchronous": set("mini-fan-motor-ac-synchronous", [
    ["AC 220 V synchronous motor with mounting ears and yellow leads", false],
    ["Rating label: AC 220 V, 50/60 Hz, 4 W, 2.5–3 RPM", false],
    ["Mounting ears and yellow supply leads of the synchronous motor", false],
  ]),
  "washing-machine-timer": set("washing-machine-timer", [
    ["Washing machine timer with transparent blue cover and colour-coded leads"],
    ["Washing machine timer, angled view with mounting tabs"],
    ["Close-up of the timer gears and contacts"],
    ["Round wash timer with mounting bracket", false],
  ]),
  "induction-cooker": set("induction-cooker", [
    ["Black single-zone induction cooker, top view"],
    ["Induction cooker at an angle, showing the low profile"],
    ["Touch control panel with power display"],
  ]),
  "ball-bearings": set("ball-bearings", [
    ["6203RS sealed ball bearing, three-quarter view"],
    ["Sealed ball bearing, face view"],
    ["Open ball bearing showing balls and cage"],
  ]),
  "heater-rod": set("heater-rod", [
    ["Curved infrared heater rod: coiled element inside a clear quartz tube"],
    ["Close-up of the coiled heating element through the quartz glass"],
    ["Ceramic end cap and lead of the heater tube"],
    ["Heater tube held at one end, showing the ceramic cap and coil"],
  ]),
  "geyser-element": set("geyser-element", [
    ["Two copper geyser elements with brass threaded heads"],
    ["Brass heads of the geyser elements"],
    ["Close-up of the copper U-bend"],
  ]),
  "washer-buttons-and-switches": set("washer-buttons-and-switches", [
    ["Red 2-position rocker switch marked O and I", false],
    ["Black oval 3-position rocker switch marked I, O and II", false],
    ["Close-up of the 3-position rocker markings", false],
  ]),
  capacitors: set("capacitors", [
    ["Blue axial film capacitor rated 450 V AC"],
    ["Capacitor marking detail"],
    ["Axial lead and capacitor symbol at the marked end"],
    ["Opposite end of the capacitor with its axial lead"],
  ]),
};

export function getPhotos(slug: string): Photo[] {
  return photos[slug] ?? [];
}
