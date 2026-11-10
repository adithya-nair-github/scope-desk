import type { ClimateProfile } from "./ditchcarbon-client";
import { DEMO_SUPPLIERS, getDemoSupplier } from "./demo-suppliers";

/** Labeled fallback profiles when no API key or upstream error. */
export function illustrativeProfile(name: string): ClimateProfile {
  const demo = getDemoSupplier(name) || DEMO_SUPPLIERS[0];
  const score = demo?.illustrativeScore ?? 55;
  return {
    name: demo?.name || name,
    website: demo?.website || null,
    hqRegion: demo?.hqRegion || null,
    industry: demo?.industry || "Unknown",
    carbonRiskScore: score,
    industryPercentile: Math.min(95, score + 5),
    industryRank: score > 75 ? 12 : score > 55 ? 48 : 120,
    regionRank: score > 75 ? 8 : 40,
    industryMeanScore: 62,
    profileUrl: null,
    organizationId: null,
    initiatives: {
      sbti: score >= 70,
      cdp: score >= 65,
      climate_pledge: score >= 80,
      re100: score >= 78,
      ecovadis: score >= 60,
    },
    reductionActionPresent: score >= 55,
    scope1: score >= 50 ? "Illustrative — see sample disclosure" : null,
    scope2: score >= 50 ? "Illustrative — see sample disclosure" : null,
    scope3: score >= 65 ? "Illustrative — value-chain estimate" : null,
    reductionTargets:
      score >= 70
        ? ["Illustrative: near-term science-based target on record", "Illustrative: net-zero ambition stated"]
        : ["Illustrative: limited public target disclosure"],
  };
}

