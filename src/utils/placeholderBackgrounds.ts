export interface PlaceholderBackground {
  name: string;
  value: string;
}

// Curated fallback backgrounds shown when a template has no uploaded
// background image, so a new/preset template never looks like a blank box.
export const PLACEHOLDER_BACKGROUNDS: PlaceholderBackground[] = [
  {
    name: "Midnight Purple",
    value: "linear-gradient(160deg, #1e1b4b 0%, #4c1d95 55%, #7e22ce 100%)",
  },
  {
    name: "Slate",
    value: "linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
  },
  {
    name: "Sunset",
    value: "linear-gradient(160deg, #7c2d12 0%, #c2410c 55%, #f59e0b 100%)",
  },
  {
    name: "Ocean",
    value: "linear-gradient(160deg, #082f49 0%, #0369a1 55%, #38bdf8 100%)",
  },
  {
    name: "Emerald",
    value: "linear-gradient(160deg, #052e16 0%, #15803d 55%, #4ade80 100%)",
  },
  {
    name: "Charcoal",
    value: "#111827",
  },
];
