/**
 * Illustrative disclosure excerpts inspired by public sustainability-report phrasing
 * (Carbon Trail used H&M Group as a sample company). Clearly labeled illustrative.
 */

export const SAMPLE_DISCLOSURES = {
  "hm-group": {
    id: "hm-group",
    companyName: "H&M Group",
    title: "Illustrative excerpt — H&M Group–style annual & sustainability report",
    disclaimer:
      "ILLUSTRATIVE SAMPLE TEXT for demo extraction only. Numbers and wording are fabricated for this portfolio prototype and are not a copy of any real filing.",
    sourceLabel: "Illustrative sample disclosure (H&M Group–style)",
    text: `H&M Group — Annual and sustainability report (illustrative excerpt)

Our climate work follows the GHG Protocol. We report absolute emissions for our own operations and the value chain.

Total Scope 1 emissions amounted to 12,450 tCO2e in the reporting year, mainly from facility fuels and company cars.

Total Scope 2 emissions (market-based) were 48,200 tCO2e. 86% of our sourced electricity was renewable.

Total Scope 3 emissions were estimated at 6,820,000 tCO2e. The largest share sits in purchased goods and services.

Purchased goods and services 5,410,000 tCO2e
Upstream transportation and distribution 420,500 tCO2e
Business travel 18,700 tCO2e

We remain committed to science-based targets validated by SBTi and are working toward net-zero by 2040 across our value chain.

Headquartered in Stockholm, Sweden. This excerpt is illustrative sample content for a portfolio prototype.`,
  },
  arvind: {
    id: "arvind",
    companyName: "Arvind Ltd",
    title: "Illustrative excerpt — Arvind Ltd–style BRSR / sustainability narrative",
    disclaimer:
      "ILLUSTRATIVE SAMPLE TEXT. Not transcribed from a real BRSR filing. Used to demo messy-to-clean normalization.",
    sourceLabel: "Illustrative sample disclosure (Arvind Ltd–style)",
    text: `Arvind Limited — Sustainability narrative (illustrative)

Boundary: manufacturing operations in India unless noted.

Total Scope 1 emissions 86,300 tCO2e from captive boilers and process fuels.
Total Scope 2 emissions 152,000 tCO2e (location-based grid electricity).
Share of renewable energy — 34%.

Scope 3 work is progressing. Purchased goods and services 1,240,000 tCO2e.
Upstream transportation and distribution 96,400 tCO2e.
Business travel 4,200 tCO2e.

The company has committed to evaluate science-based targets with SBTi and discloses intensity metrics alongside absolute totals.

This text is illustrative sample content for extraction demos only.`,
  },
  "indie-pack": {
    id: "indie-pack",
    companyName: "Northwind Packaging Co",
    title: "Sparse SME disclosure (illustrative) — missing Scope 3",
    disclaimer: "Fictional supplier with thin public data — used for self-correction demos.",
    sourceLabel: "Illustrative sparse disclosure",
    text: `Northwind Packaging Co — Environmental statement (illustrative)

We care about sustainability. Our plants run more efficiently each year.
Facility electricity use was reduced versus last year.
We do not yet publish a full GHG inventory aligned to the GHG Protocol.

Contact sustainability@northwind-example.com for questionnaires.`,
  },
} as const;

export type SampleDisclosureId = keyof typeof SAMPLE_DISCLOSURES;
