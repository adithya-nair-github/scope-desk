/** Client-safe Scope 3 gap-checker helpers (parse → map → coverage → flags → plan). */

export const SCOPE3 = [
  "1. Purchased goods and services",
  "2. Capital goods",
  "3. Fuel- and energy-related activities",
  "4. Upstream transportation and distribution",
  "5. Waste generated in operations",
  "6. Business travel",
  "7. Employee commuting",
  "8. Upstream leased assets",
  "9. Downstream transportation and distribution",
  "10. Processing of sold products",
  "11. Use of sold products",
  "12. End-of-life treatment of sold products",
  "13. Downstream leased assets",
  "14. Franchises",
  "15. Investments",
  "Unmapped / needs review",
] as const;

export const UNMAPPED = SCOPE3[15];

/** Keyword rules: first match wins. More specific categories before broad purchased goods. */
const RULES: Array<{ cat: string; keys: string[] }> = [
  { cat: SCOPE3[6], keys: ["commuting", "commute", "employee travel to work"] },
  {
    cat: SCOPE3[5],
    keys: ["business travel", "hotel", "airfare", "flight", "airline", "travel"],
  },
  { cat: SCOPE3[4], keys: ["waste", "recycling", "disposal", "landfill"] },
  {
    cat: SCOPE3[3],
    keys: [
      "upstream transport",
      "inbound freight",
      "freight",
      "shipping",
      "logistics",
      "courier",
      "air cargo",
      "transportation",
      "transport",
    ],
  },
  {
    cat: SCOPE3[8],
    keys: ["downstream transport", "outbound freight", "last mile", "delivery to customer"],
  },
  { cat: SCOPE3[2], keys: ["fuel", "energy-related", "well-to-tank"] },
  {
    cat: SCOPE3[1],
    keys: ["capital", "machinery", "equipment purchase", "fit-out", "construction", "capex"],
  },
  { cat: SCOPE3[7], keys: ["leased", "lease vehicle", "company car", "upstream lease"] },
  { cat: SCOPE3[12], keys: ["downstream lease", "leased to customer"] },
  { cat: SCOPE3[13], keys: ["franchise"] },
  { cat: SCOPE3[14], keys: ["investment", "portfolio", "equity"] },
  { cat: SCOPE3[9], keys: ["processing of sold", "intermediate processing"] },
  { cat: SCOPE3[10], keys: ["use of sold", "product in use"] },
  { cat: SCOPE3[11], keys: ["end-of-life", "product disposal", "take-back"] },
  {
    cat: SCOPE3[0],
    keys: [
      "purchased goods",
      "raw material",
      "office supplies",
      "it services",
      "saas",
      "software",
      "telecom",
      "professional services",
      "consulting",
      "advisory",
      "marketing",
      "facilities",
      "maintenance",
      "catering",
      "meals",
      "apparel",
      "uniform",
      "cloud",
      "hosting",
      "data centre",
      "data center",
      "hardware",
      "goods",
      "services",
      "supplies",
      "packaging",
    ],
  },
];

const CATEGORY_OWNERS: Record<string, string> = {
  [SCOPE3[0]]: "Procurement / category managers",
  [SCOPE3[1]]: "Finance (CapEx) and facilities",
  [SCOPE3[2]]: "Facilities / energy manager",
  [SCOPE3[3]]: "Logistics / supply chain",
  [SCOPE3[4]]: "Facilities / EHS",
  [SCOPE3[5]]: "Travel / HR / finance",
  [SCOPE3[6]]: "HR / facilities",
  [SCOPE3[7]]: "Real estate / fleet",
  [SCOPE3[8]]: "Logistics / customer ops",
  [SCOPE3[9]]: "Product / manufacturing partners",
  [SCOPE3[10]]: "Product / R&D",
  [SCOPE3[11]]: "Product / reverse logistics",
  [SCOPE3[12]]: "Real estate / leasing",
  [SCOPE3[13]]: "Franchise ops",
  [SCOPE3[14]]: "Finance / investments",
};

export type SpendRow = {
  supplier: string;
  category: string;
  spend: number | null;
  country: string;
  mapped: string;
};

export type CoverageRow = {
  cat: string;
  status: "Missing" | "Partial" | "Data provided";
  rows: number;
  share: number;
  spend: number;
  /** How much of this category's spend counts toward coverage (full / half / none). */
  coveredSpend: number;
  spendImpact: "High" | "Med" | "Low" | "None";
};

export type QualityFlag = {
  type: "missing_spend" | "missing_country" | "unrecognised" | "duplicate";
  label: string;
  detail: string;
  fix: string;
  spendImpact?: "High" | "Med" | "Low" | "None";
  supplier?: string;
  category?: string;
};

export type PlanWeek = {
  title: string;
  intro: string;
  bullets: string[];
};

export type PlanTask = {
  id: string;
  week: string;
  supplier: string;
  category: string;
  spendImpact: "High" | "Med" | "Low" | "None";
  owner: string;
  task: string;
};

function statusWeight(status: CoverageRow["status"]) {
  if (status === "Data provided") return 1;
  if (status === "Partial") return 0.5;
  return 0;
}

export function spendImpactBand(
  spend: number,
  totalSpend: number,
): "High" | "Med" | "Low" | "None" {
  if (!spend || !totalSpend) return "None";
  const share = spend / totalSpend;
  if (share >= 0.1) return "High";
  if (share >= 0.03) return "Med";
  return "Low";
}

export function mapCategory(category: string, supplier: string) {
  const hay = `${category} ${supplier}`.toLowerCase();
  if (!hay.trim()) return UNMAPPED;
  return RULES.find((r) => r.keys.some((k) => hay.includes(k)))?.cat || UNMAPPED;
}

export function parseCsv(text: string): SpendRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV needs a header and at least one row.");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = {
    supplier: headers.findIndex((h) => /supplier|vendor|company/.test(h)),
    category: headers.findIndex((h) => /category|description|type/.test(h)),
    spend: headers.findIndex((h) => /spend|amount|value|cost/.test(h)),
    country: headers.findIndex((h) => /country|region|location/.test(h)),
  };
  if (idx.spend < 0) throw new Error("Missing spend column (spend / amount / value).");
  if (idx.supplier < 0 && idx.category < 0) {
    throw new Error("Need a supplier or category column.");
  }

  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(",");
      const category = idx.category >= 0 ? cells[idx.category]?.trim() || "" : "";
      const supplier = idx.supplier >= 0 ? cells[idx.supplier]?.trim() || "" : "(unnamed)";
      const country = idx.country >= 0 ? cells[idx.country]?.trim() || "" : "";
      const rawSpend = cells[idx.spend]?.replace(/[$,]/g, "").trim();
      const spend = rawSpend ? Number(rawSpend) : null;
      return {
        supplier: supplier || "(unnamed supplier)",
        category: category || "—",
        spend: Number.isFinite(spend as number) ? spend : null,
        country,
        mapped: mapCategory(category, supplier),
      };
    });
}

export function computeCoverage(rows: SpendRow[]): {
  coverage: CoverageRow[];
  readiness: number;
  categoryReadiness: number;
  totalSpend: number;
  spendUnderCoverage: number;
  uncoveredSpend: number;
  unmappedSpend: number;
} {
  const totalSpend = rows.reduce((s, r) => s + (r.spend || 0), 0);
  const unmappedSpend = rows
    .filter((r) => r.mapped === UNMAPPED)
    .reduce((s, r) => s + (r.spend || 0), 0);

  const coverage = SCOPE3.slice(0, 15).map((cat) => {
    const matched = rows.filter((r) => r.mapped === cat);
    const spendMissing = matched.some((r) => r.spend == null);
    const spend = matched.reduce((s, r) => s + (r.spend || 0), 0);
    const status: CoverageRow["status"] = !matched.length
      ? "Missing"
      : spendMissing
        ? "Partial"
        : "Data provided";
    const coveredSpend = spend * statusWeight(status);
    return {
      cat,
      status,
      rows: matched.length,
      share: totalSpend ? (spend / totalSpend) * 100 : 0,
      spend,
      coveredSpend,
      spendImpact: spendImpactBand(spend, totalSpend),
    };
  });

  const mappedCovered = coverage.reduce((s, c) => s + c.coveredSpend, 0);
  // Unmapped spend is fully uncovered for data-readiness.
  const spendUnderCoverage = mappedCovered;
  const uncoveredSpend = Math.max(0, totalSpend - spendUnderCoverage);

  const spendReadiness =
    totalSpend > 0 ? Math.round((spendUnderCoverage / totalSpend) * 100) : 0;

  const categorySum = coverage.reduce((s, c) => s + statusWeight(c.status), 0);
  const categoryReadiness = Math.round((categorySum / 15) * 100);

  // Primary readiness is spend-weighted; missing high-spend (or unmapped) dollars hurt more.
  const readiness = totalSpend > 0 ? spendReadiness : categoryReadiness;

  return {
    coverage,
    readiness,
    categoryReadiness,
    totalSpend,
    spendUnderCoverage,
    uncoveredSpend,
    unmappedSpend,
  };
}

export function computeFlags(rows: SpendRow[]): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const totalSpend = rows.reduce((s, r) => s + (r.spend || 0), 0);

  rows.forEach((r, idx) => {
    if (r.spend == null) {
      flags.push({
        type: "missing_spend",
        label: "Missing spend",
        detail: `Row ${idx + 1} — ${r.supplier} has no spend amount.`,
        fix: "Ask finance or procurement to fill the annual (or period) spend for this supplier.",
        spendImpact: "None",
        supplier: r.supplier,
        category: r.mapped,
      });
    }
    if (!r.country) {
      flags.push({
        type: "missing_country",
        label: "Missing country",
        detail: `Row ${idx + 1} — ${r.supplier} has no country.`,
        fix: "Add HQ or shipping country so later emissions factors and entity matching work better.",
        spendImpact: spendImpactBand(r.spend || 0, totalSpend),
        supplier: r.supplier,
        category: r.mapped,
      });
    }
    if (r.mapped === UNMAPPED) {
      flags.push({
        type: "unrecognised",
        label: "Unrecognised category",
        detail: `Row ${idx + 1} — “${r.category}” did not match a Scope 3 category.`,
        fix: "Pick the closest GHG Protocol category from the dropdown, or ask the category owner how this spend is used.",
        spendImpact: spendImpactBand(r.spend || 0, totalSpend),
        supplier: r.supplier,
        category: r.category,
      });
    }
  });

  const seen: Record<string, number[]> = {};
  rows.forEach((r, idx) => {
    const key = r.supplier.trim().toLowerCase();
    if (!seen[key]) seen[key] = [];
    seen[key].push(idx + 1);
  });
  Object.values(seen).forEach((indexes) => {
    if (indexes.length > 1) {
      const name = rows[indexes[0] - 1].supplier;
      const dupSpend = indexes.reduce((s, i) => s + (rows[i - 1].spend || 0), 0);
      flags.push({
        type: "duplicate",
        label: "Duplicate supplier",
        detail: `“${name}” appears on rows ${indexes.join(", ")}.`,
        fix: "Confirm whether these are the same legal entity. Merge rows or keep both if they are different contracts — but flag for entity resolution later.",
        spendImpact: spendImpactBand(dupSpend, totalSpend),
        supplier: name,
        category: rows[indexes[0] - 1].mapped,
      });
    }
  });

  return flags;
}

function shortCategory(cat: string) {
  return cat.replace(/^\d+\.\s*/, "");
}

export function buildPlanTasks(rows: SpendRow[]): PlanTask[] {
  const { coverage, totalSpend, uncoveredSpend, unmappedSpend } = computeCoverage(rows);
  const flags = computeFlags(rows);
  const tasks: PlanTask[] = [];
  let n = 1;

  const push = (partial: Omit<PlanTask, "id">) => {
    tasks.push({ ...partial, id: `T${String(n++).padStart(2, "0")}` });
  };

  push({
    week: "Week 1",
    supplier: "— (portfolio)",
    category: "All categories",
    spendImpact: spendImpactBand(uncoveredSpend, totalSpend),
    owner: "Customer success + sustainability lead",
    task: `Walk the gap report: $${Math.round(uncoveredSpend).toLocaleString()} uncovered spend of $${Math.round(totalSpend).toLocaleString()} total — data-readiness only, not CO₂e.`,
  });

  flags
    .filter((f) => f.type === "duplicate" || f.type === "missing_spend" || f.type === "unrecognised")
    .slice(0, 8)
    .forEach((f) => {
      const supplier = f.supplier || "Unknown supplier";
      const category = f.category || "Unmapped";
      const impact = f.spendImpact || "Low";
      if (f.type === "duplicate") {
        push({
          week: "Week 1",
          supplier,
          category: shortCategory(category),
          spendImpact: impact,
          owner: "Procurement ops + finance data steward",
          task: `Identify primary contact for Supplier [${supplier}] to resolve data gap (Category: ${shortCategory(category)} — Spend impact: ${impact}). Confirm whether duplicate rows are the same legal entity.`,
        });
      } else if (f.type === "missing_spend") {
        push({
          week: "Week 1",
          supplier,
          category: shortCategory(category),
          spendImpact: impact,
          owner: "Finance data steward",
          task: `Request missing spend amount for Supplier [${supplier}] (Category: ${shortCategory(category)} — Spend impact: ${impact}).`,
        });
      } else {
        push({
          week: "Week 1",
          supplier,
          category: shortCategory(category),
          spendImpact: impact,
          owner: "Procurement / category managers",
          task: `Map spend label for Supplier [${supplier}] to a GHG Protocol Scope 3 category (raw: “${category}” — Spend impact: ${impact}).`,
        });
      }
    });

  if (unmappedSpend > 0) {
    push({
      week: "Week 1",
      supplier: "— (unmapped rows)",
      category: "Unmapped / needs review",
      spendImpact: spendImpactBand(unmappedSpend, totalSpend),
      owner: "Procurement ops",
      task: `Clear $${Math.round(unmappedSpend).toLocaleString()} in unmapped spend before enrichment — Spend impact: ${spendImpactBand(unmappedSpend, totalSpend)}.`,
    });
  }

  coverage
    .filter((c) => c.status === "Partial")
    .sort((a, b) => b.spend - a.spend)
    .forEach((c) => {
      push({
        week: "Week 2",
        supplier: "— (category fill)",
        category: shortCategory(c.cat),
        spendImpact: c.spendImpact,
        owner: CATEGORY_OWNERS[c.cat] || "Finance",
        task: `Finish partial category [${shortCategory(c.cat)}] by filling missing spend rows ($${Math.round(c.spend).toLocaleString()} already mapped — Spend impact: ${c.spendImpact}).`,
      });
    });

  const earlyFocus = [
    SCOPE3[0],
    SCOPE3[3],
    SCOPE3[5],
    SCOPE3[1],
    SCOPE3[4],
    SCOPE3[6],
    SCOPE3[2],
  ];
  coverage
    .filter((c) => c.status === "Missing")
    .sort((a, b) => {
      // Prefer categories that usually matter early; then any residual spend signal.
      const ai = earlyFocus.indexOf(a.cat as (typeof earlyFocus)[number]);
      const bi = earlyFocus.indexOf(b.cat as (typeof earlyFocus)[number]);
      const aRank = ai === -1 ? 99 : ai;
      const bRank = bi === -1 ? 99 : bi;
      if (aRank !== bRank) return aRank - bRank;
      return b.spend - a.spend;
    })
    .slice(0, 5)
    .forEach((c) => {
      const owner = CATEGORY_OWNERS[c.cat] || "the relevant function";
      push({
        week: "Week 3",
        supplier: "— (category outreach)",
        category: shortCategory(c.cat),
        spendImpact: c.spendImpact === "None" ? "Med" : c.spendImpact,
        owner,
        task: `Open a data request for Category [${shortCategory(c.cat)}] — ask for supplier list + spend (or activity data) for the last full year. Suggested owner: ${owner}. Spend impact if blank in file: ${c.spendImpact}.`,
      });
    });

  push({
    week: "Week 4",
    supplier: "— (handoff)",
    category: "All categories",
    spendImpact: spendImpactBand(uncoveredSpend, totalSpend),
    owner: "Customer success + sustainability lead",
    task: `Re-run the gap check and compare spend-under-coverage to Week 1 baseline ($${Math.round(uncoveredSpend).toLocaleString()} uncovered today). Agree which High-impact categories must reach “Data provided” before supplier engagement.`,
  });

  return tasks;
}

export function buildPlan(rows: SpendRow[]): {
  weeks: PlanWeek[];
  readiness: number;
  flagCount: number;
  tasks: PlanTask[];
} {
  const { coverage, readiness, totalSpend, spendUnderCoverage, uncoveredSpend } =
    computeCoverage(rows);
  const flags = computeFlags(rows);
  const tasks = buildPlanTasks(rows);
  const missing = coverage.filter((r) => r.status === "Missing");
  const partial = coverage.filter((r) => r.status === "Partial");
  const provided = coverage.filter((r) => r.status === "Data provided");

  const earlyFocus = [
    SCOPE3[0],
    SCOPE3[3],
    SCOPE3[5],
    SCOPE3[1],
    SCOPE3[4],
    SCOPE3[6],
    SCOPE3[2],
  ];
  const priorityMissing = [...missing]
    .sort((a, b) => {
      const ai = earlyFocus.indexOf(a.cat as (typeof earlyFocus)[number]);
      const bi = earlyFocus.indexOf(b.cat as (typeof earlyFocus)[number]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 5);

  const highImpactGaps = coverage
    .filter((c) => c.status !== "Data provided" && (c.spendImpact === "High" || c.spendImpact === "Med"))
    .sort((a, b) => b.spend - a.spend);

  const weeks: PlanWeek[] = [
    {
      title: "Week 1 — Align on the file and fix the easy quality issues",
      intro:
        "Start with spend under coverage. Treat this as a data-readiness check, not an emissions calculation.",
      bullets: [
        `Walk the customer through $${Math.round(spendUnderCoverage).toLocaleString()} spend under coverage vs $${Math.round(uncoveredSpend).toLocaleString()} uncovered (readiness ${readiness}%, spend-weighted).`,
        flags.length
          ? `Clear the ${flags.length} quality flag(s): missing spend, missing country, duplicates, and unmapped categories. Owner: procurement ops + finance data steward.`
          : "Quality flags look clean — confirm column definitions (spend period, currency, legal entity name) with finance.",
        "Confirm who owns the supplier master (procurement) vs the spend ledger (finance). Expect: a named data owner and a weekly check-in slot.",
      ],
    },
    {
      title: "Week 2 — Strengthen what you already mapped",
      intro:
        "Improve confidence in high-spend rows that already landed in a Scope 3 category before chasing brand-new data sources.",
      bullets: [
        provided.length
          ? `Lock the ${provided.length} categor(y/ies) already marked “Data provided” — these become your baseline for spend matching later.`
          : "No category is fully complete yet — pick the highest-spend mapped rows and validate category assignment with the category manager.",
        ...(partial.length
          ? [
              `Finish partial categories (${partial.map((p) => p.cat).join("; ")}) by filling missing spend. Owner: finance.`,
            ]
          : []),
        highImpactGaps.length
          ? `Prioritize financial impact: ${highImpactGaps
              .slice(0, 3)
              .map((g) => `${shortCategory(g.cat)} (${g.spendImpact}, $${Math.round(g.spend).toLocaleString()})`)
              .join("; ")}.`
          : "No Med/High spend gaps in mapped categories — keep chasing blank categories that matter for the program.",
        "Produce a short “source of truth” note: which ERP extract, which date range, and which currency. Expect: one agreed extract for the rest of onboarding.",
      ],
    },
    {
      title: "Week 3 — Close the highest-priority gaps",
      intro:
        "Focus outreach on Missing categories that usually drive early Scope 3 programmes — and any remaining high uncovered spend.",
      bullets: [
        ...(priorityMissing.length
          ? priorityMissing.map((m) => {
              const owner = CATEGORY_OWNERS[m.cat] || "the relevant function";
              return `Open a data request for ${m.cat}. Usual owner: ${owner}. Ask for supplier list + spend (or activity data) for the last full year.`;
            })
          : [
              "All 15 categories have at least some rows — use this week to deepen the thin ones and document estimation methods where spend is a proxy.",
            ]),
        "Expect: incomplete returns are normal. Capture “not applicable” vs “not yet available” so Missing stays honest.",
      ],
    },
    {
      title: "Week 4 — Hand off a clean readiness pack",
      intro:
        "Leave the customer with a package their sustainability and procurement teams can act on without you in every meeting.",
      bullets: [
        `Re-run this gap check and compare spend-under-coverage to the Week 1 baseline ($${Math.round(spendUnderCoverage).toLocaleString()} / $${Math.round(totalSpend).toLocaleString()} today; readiness ${readiness}%).`,
        "Export or copy the structured 30-day task table into Jira/Asana/onboarding workspace.",
        "Agree the next milestone: which High-impact categories must reach “Data provided” before supplier engagement or enrichment begins. Owner: customer success + sustainability lead.",
        "What to expect: a clearer backlog, named owners per category, and fewer surprise gaps when leadership asks “are we ready for Scope 3?”",
      ],
    },
  ];

  return { weeks, readiness, flagCount: flags.length, tasks };
}

/** Structured Markdown for clipboard / Jira-Asana paste. */
export function planAsMarkdown(rows: SpendRow[]) {
  const plan = buildPlan(rows);
  const { spendUnderCoverage, uncoveredSpend, totalSpend, readiness, categoryReadiness } =
    computeCoverage(rows);

  const lines = [
    "# Scope 3 onboarding — first 30 days plan",
    "",
    "> Data-readiness only — not a CO₂e calculation.",
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Spend-weighted readiness | ${readiness}% |`,
    `| Category completeness (secondary) | ${categoryReadiness}% |`,
    `| Spend under coverage | $${Math.round(spendUnderCoverage).toLocaleString()} |`,
    `| Uncovered spend | $${Math.round(uncoveredSpend).toLocaleString()} |`,
    `| Total spend in file | $${Math.round(totalSpend).toLocaleString()} |`,
    "",
    "## Task board (Jira / Asana style)",
    "",
    "| ID | Week | Supplier | Category | Spend impact | Owner | Task |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...plan.tasks.map(
      (t) =>
        `| ${t.id} | ${t.week} | ${t.supplier} | ${t.category} | ${t.spendImpact} | ${t.owner} | ${t.task} |`,
    ),
    "",
    "## Week narrative",
    "",
  ];

  plan.weeks.forEach((w) => {
    lines.push(`### ${w.title}`);
    lines.push("");
    lines.push(w.intro);
    lines.push("");
    w.bullets.forEach((b) => lines.push(`- [ ] ${b}`));
    lines.push("");
  });

  return lines.join("\n");
}

/** @deprecated Prefer planAsMarkdown — kept for any callers expecting plain text. */
export function planAsPlainText(rows: SpendRow[]) {
  return planAsMarkdown(rows);
}
