/**
 * Prefill suppliers aligned with Carbon Trail examples + a few procurement rivals.
 * Used for selectable demos (max ~10 for free-trial style testing).
 */

export type DemoSupplier = {
  id: string;
  name: string;
  website?: string;
  hqRegion?: string;
  isin?: string;
  lei?: string;
  industry: string;
  /** Illustrative unit price for procurement mock */
  unitPriceUsd: number;
  leadTimeDays: number;
  /** Illustrative fallback score 0–100 when API key missing */
  illustrativeScore: number;
  notes: string;
};

export const DEMO_SUPPLIERS: DemoSupplier[] = [
  {
    id: "hm-group",
    name: "H&M Group",
    website: "https://hmgroup.com",
    hqRegion: "SE",
    industry: "Apparel retail",
    unitPriceUsd: 12.4,
    leadTimeDays: 18,
    illustrativeScore: 72,
    notes: "Carbon Trail–style disclosure example (illustrative).",
  },
  {
    id: "arvind",
    name: "Arvind Ltd",
    website: "https://www.arvind.com",
    hqRegion: "IN",
    industry: "Textiles & apparel manufacturing",
    unitPriceUsd: 9.8,
    leadTimeDays: 24,
    illustrativeScore: 58,
    notes: "Carbon Trail sample supplier for India disclosure frameworks.",
  },
  {
    id: "unilever",
    name: "Unilever",
    website: "https://www.unilever.com",
    hqRegion: "GB",
    industry: "Consumer goods",
    unitPriceUsd: 14.2,
    leadTimeDays: 14,
    illustrativeScore: 81,
    notes: "Well-known SBTi participant for live API demos.",
  },
  {
    id: "nestle",
    name: "Nestlé",
    website: "https://www.nestle.com",
    hqRegion: "CH",
    industry: "Food & beverage",
    unitPriceUsd: 11.1,
    leadTimeDays: 16,
    illustrativeScore: 69,
    notes: "Common enterprise vendor for side-by-side procurement tests.",
  },
  {
    id: "apple",
    name: "Apple",
    website: "https://www.apple.com",
    hqRegion: "US",
    isin: "US0378331005",
    industry: "Technology hardware",
    unitPriceUsd: 890,
    leadTimeDays: 10,
    illustrativeScore: 84,
    notes: "Useful for ISIN-based SBTi lookups.",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    website: "https://www.microsoft.com",
    hqRegion: "US",
    industry: "Software & cloud",
    unitPriceUsd: 42,
    leadTimeDays: 3,
    illustrativeScore: 86,
    notes: "Cloud / SaaS category for Scope 3 purchased services.",
  },
  {
    id: "maersk",
    name: "A.P. Moller - Maersk",
    website: "https://www.maersk.com",
    hqRegion: "DK",
    industry: "Shipping & logistics",
    unitPriceUsd: 2200,
    leadTimeDays: 28,
    illustrativeScore: 63,
    notes: "Upstream transportation category rival.",
  },
  {
    id: "dhl",
    name: "Deutsche Post DHL Group",
    website: "https://www.dhl.com",
    hqRegion: "DE",
    industry: "Logistics",
    unitPriceUsd: 1980,
    leadTimeDays: 21,
    illustrativeScore: 67,
    notes: "Competing logistics vendor for POS mock.",
  },
  {
    id: "indie-pack",
    name: "Northwind Packaging Co",
    website: "https://example.com/northwind-packaging",
    hqRegion: "US",
    industry: "Packaging",
    unitPriceUsd: 3.2,
    leadTimeDays: 12,
    illustrativeScore: 41,
    notes: "Fictional SME with thin public disclosure — good for supplier self-correction.",
  },
  {
    id: "cedar-freight",
    name: "Riverbend Freight Ltd",
    website: "https://example.com/riverbend-freight",
    hqRegion: "DE",
    industry: "Freight",
    unitPriceUsd: 1750,
    leadTimeDays: 19,
    illustrativeScore: 48,
    notes: "Fictional freight supplier for missing-data demos.",
  },
];

export function getDemoSupplier(idOrName: string) {
  const q = idOrName.trim().toLowerCase();
  return (
    DEMO_SUPPLIERS.find((s) => s.id === q || s.name.toLowerCase() === q) ||
    DEMO_SUPPLIERS.find((s) => s.name.toLowerCase().includes(q)) ||
    null
  );
}
