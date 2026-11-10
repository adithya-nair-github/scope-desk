/**
 * Keyword / regex extraction from unstructured sustainability report text.
 * Adapted from Carbon Trail mine-esg patterns — evidence-linked, no invented figures.
 */

export type EvidenceField = {
  id: string;
  label: string;
  ghgBucket: "Scope 1" | "Scope 2" | "Scope 3" | "Energy" | "Target" | "Other";
  value: string;
  evidenceSnippet: string;
  sourceLabel: string;
};

function commas(digits: string) {
  const n = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(n)) return digits;
  return n.toLocaleString("en-US");
}

function snippetAround(text: string, matchIndex: number, matchLen: number) {
  const start = Math.max(0, matchIndex - 60);
  const end = Math.min(text.length, matchIndex + matchLen + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function capture(
  text: string,
  pattern: RegExp,
  map: (m: RegExpMatchArray) => Omit<EvidenceField, "evidenceSnippet" | "sourceLabel">,
  sourceLabel: string,
): EvidenceField | null {
  const match = text.match(pattern);
  if (!match || match.index == null) return null;
  const mapped = map(match);
  return {
    ...mapped,
    evidenceSnippet: snippetAround(text, match.index, match[0].length),
    sourceLabel,
  };
}

/** Mine Scope 1–3 and related fields from disclosure prose. */
export function normalizeDisclosureText(text: string, sourceLabel = "Uploaded / sample disclosure") {
  const flat = text.replace(/\u00a0/g, " ");
  const fields: EvidenceField[] = [];

  const push = (field: EvidenceField | null) => {
    if (field) fields.push(field);
  };

  push(
    capture(
      flat,
      /(?:Total\s+)?Scope\s*1(?:\s+GHG)?\s+emissions[\s\S]{0,280}?([\d,]{4,9})(?:\s*(?:tCO2e|tonnes?|metric tons))?/i,
      (m) => ({
        id: "scope_1",
        label: "Scope 1 GHG emissions",
        ghgBucket: "Scope 1",
        value: `${commas(m[1])} tCO2e`,
      }),
      sourceLabel,
    ),
  );

  push(
    capture(
      flat,
      /(?:Total\s+)?Scope\s*2(?:\s+\((?:market|location)[- ]based\))?(?:\s+GHG)?\s+emissions[\s\S]{0,280}?([\d,]{4,9})(?:\s*(?:tCO2e|tonnes?))?/i,
      (m) => ({
        id: "scope_2",
        label: "Scope 2 GHG emissions",
        ghgBucket: "Scope 2",
        value: `${commas(m[1])} tCO2e`,
      }),
      sourceLabel,
    ),
  );

  push(
    capture(
      flat,
      /(?:Total\s+)?Scope\s*3(?:\s+GHG)?\s+emissions[\s\S]{0,320}?([\d,]{5,12})(?:\s*(?:tCO2e|tonnes?))?/i,
      (m) => ({
        id: "scope_3",
        label: "Scope 3 GHG emissions",
        ghgBucket: "Scope 3",
        value: `${commas(m[1])} tCO2e`,
      }),
      sourceLabel,
    ),
  );

  // Common Scope 3 category lines
  const catPatterns: Array<{ id: string; label: string; re: RegExp }> = [
    {
      id: "s3_purchased_goods",
      label: "Scope 3 — Purchased goods and services",
      re: /Purchased goods and services[\s\S]{0,120}?([\d,]{4,12})/i,
    },
    {
      id: "s3_transport",
      label: "Scope 3 — Upstream transportation",
      re: /(?:Upstream )?transportation and distribution[\s\S]{0,120}?([\d,]{4,12})/i,
    },
    {
      id: "s3_travel",
      label: "Scope 3 — Business travel",
      re: /Business travel[\s\S]{0,100}?([\d,]{3,10})/i,
    },
  ];

  for (const cat of catPatterns) {
    push(
      capture(
        flat,
        cat.re,
        (m) => ({
          id: cat.id,
          label: cat.label,
          ghgBucket: "Scope 3",
          value: `${commas(m[1])} tCO2e`,
        }),
        sourceLabel,
      ),
    );
  }

  push(
    capture(
      flat,
      /(\d{1,3})\s*%\s+of (?:our )?sourced electricity was renewable/i,
      (m) => ({
        id: "renewable_electricity",
        label: "Renewable electricity share",
        ghgBucket: "Energy",
        value: `${m[1]}% renewable electricity`,
      }),
      sourceLabel,
    ),
  );

  push(
    capture(
      flat,
      /(?:science[- ]based|SBTi)[^.!?\n]{0,160}?(?:target|committed|validated)[^.!?\n]{0,80}/i,
      (m) => ({
        id: "sbti_mention",
        label: "Science-based target mention",
        ghgBucket: "Target",
        value: m[0].replace(/\s+/g, " ").trim(),
      }),
      sourceLabel,
    ),
  );

  push(
    capture(
      flat,
      /net[- ]zero[^.!?\n]{0,100}?(20\d{2})/i,
      (m) => ({
        id: "net_zero",
        label: "Net-zero commitment year",
        ghgBucket: "Target",
        value: `Net-zero referenced for ${m[1]}`,
      }),
      sourceLabel,
    ),
  );

  const byBucket = {
    "Scope 1": fields.filter((f) => f.ghgBucket === "Scope 1"),
    "Scope 2": fields.filter((f) => f.ghgBucket === "Scope 2"),
    "Scope 3": fields.filter((f) => f.ghgBucket === "Scope 3"),
    Energy: fields.filter((f) => f.ghgBucket === "Energy"),
    Target: fields.filter((f) => f.ghgBucket === "Target"),
    Other: fields.filter((f) => f.ghgBucket === "Other"),
  };

  return {
    fieldCount: fields.length,
    fields,
    byBucket,
    note: "Figures are kept only when the pasted text states them. Missing buckets mean the excerpt did not contain a clear number — not that emissions are zero.",
  };
}
