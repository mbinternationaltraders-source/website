// Breakdown videos (AI-generated, owner-supplied; burned-in text removed, upscaled with Apple super-resolution).
// Files: /public/videos/<base>-{1440,1080,720}.mp4 and /public/images/videos/<base>.webp (poster).
// The internals shown are typical construction, not a verified teardown of a specific model.
export type ProductVideo = {
  base: string;
  title: string;
  parts: string[];
  accent: string; // industry slug for the colour accent
};

const videos: Record<string, ProductVideo> = {
  "induction-cooker": {
    base: "inside-induction",
    title: "Inside an induction cooker",
    parts: ["Glass-ceramic top", "Copper induction coil", "Ferrite bars", "Mica insulation", "Power board", "Control board", "Base housing"],
    accent: "kitchen-appliance",
  },
  capacitors: {
    base: "inside-capacitors",
    title: "Inside a film capacitor",
    parts: ["Plastic case", "Resin fill", "Metallised film winding", "Sprayed-metal ends", "Self-healing film"],
    accent: "fan",
  },
};

export const getVideo = (slug: string): ProductVideo | undefined => videos[slug];
export const videoSources = (base: string) => [
  { src: `/videos/${base}-1440.mp4`, media: "(min-width: 1200px)" },
  { src: `/videos/${base}-1080.mp4`, media: "(min-width: 769px)" },
  { src: `/videos/${base}-720.mp4` },
];
export const videoPoster = (base: string) => `/images/videos/${base}.webp`;
