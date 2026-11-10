/**
 * Server-only Ditch Carbon API client.
 * Auth stays on the server (Bearer token). Never import this into client components.
 *
 * Docs:
 * - SBTi: GET https://api.ditchcarbon.com/sbti_companies
 * - Register / climate profile: POST https://api.ditchcarbon.com/organizations
 * - Detail refresh: GET https://api.ditchcarbon.com/organizations/{id}
 */

export const DITCHCARBON_API_BASE =
  process.env.DITCHCARBON_API_BASE?.trim() || "https://api.ditchcarbon.com";

export type ApiSource = "live" | "illustrative" | "unavailable";

export type LiveStatus = {
  keyConfigured: boolean;
  source: ApiSource;
  message: string;
  httpStatus?: number;
};

export type ClimateProfile = {
  name: string;
  website: string | null;
  hqRegion: string | null;
  industry: string | null;
  /** Display score 0–100 (API returns 0–1). */
  carbonRiskScore: number | null;
  industryPercentile: number | null;
  industryRank: number | null;
  regionRank: number | null;
  industryMeanScore: number | null;
  profileUrl: string | null;
  organizationId: number | null;
  initiatives: Record<string, boolean | null>;
  reductionActionPresent: boolean | null;
  /** Scope-like metrics when present on detailed plans; otherwise null. */
  scope1: string | null;
  scope2: string | null;
  scope3: string | null;
  reductionTargets: string[];
  raw?: unknown;
};

export type SbtiSnapshot = {
  companyName: string | null;
  isin: string | null;
  lei: string | null;
  nearTermStatus: string | null;
  nearTermClassification: string | null;
  nearTermYear: string | null;
  longTermStatus: string | null;
  longTermClassification: string | null;
  longTermYear: string | null;
  netZeroCommitted: string | null;
  netZeroYear: string | null;
  sector: string | null;
  location: string | null;
};

function getApiKey() {
  return process.env.DITCHCARBON_API_KEY?.trim() || "";
}

export function hasApiKey() {
  return Boolean(getApiKey());
}

async function ditchFetch(path: string, init?: RequestInit) {
  const key = getApiKey();
  if (!key) {
    return {
      ok: false as const,
      status: 0,
      error: "DITCHCARBON_API_KEY is not set. Add it to .env.local (server-side only).",
      data: null,
    };
  }

  const url = path.startsWith("http") ? path : `${DITCHCARBON_API_BASE}${path}`;
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
      // Live climate data should not be statically cached at build time
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });

    const text = await response.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 400) };
    }

    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        error: `Upstream returned ${response.status}. ${typeof data === "object" && data && "detail" in data ? String((data as { detail?: string }).detail) : text.slice(0, 180)}`,
        data,
      };
    }

    return { ok: true as const, status: response.status, error: null, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return { ok: false as const, status: 0, error: message, data: null };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function scoreTo100(score01: number | null) {
  if (score01 == null) return null;
  // API docs: 0–1; some responses may already be 0–100
  if (score01 > 1) return Math.round(Math.min(100, score01));
  return Math.round(score01 * 100);
}

function mapInitiatives(raw: unknown): Record<string, boolean | null> {
  const row = asRecord(raw);
  const out: Record<string, boolean | null> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "boolean") out[key] = value;
    else if (value && typeof value === "object" && "participating" in (value as object)) {
      const p = (value as { participating?: unknown }).participating;
      out[key] = typeof p === "boolean" ? p : null;
    } else out[key] = null;
  }
  return out;
}

function extractScopes(org: Record<string, unknown>) {
  const performances = Array.isArray(org.performances) ? org.performances : [];
  let scope1: string | null = null;
  let scope2: string | null = null;
  let scope3: string | null = null;
  for (const item of performances) {
    const row = asRecord(item);
    const label = `${str(row.name) || ""} ${str(row.category) || ""}`.toLowerCase();
    const value = str(row.value) || (num(row.value) != null ? String(num(row.value)) : null);
    if (!value) continue;
    if (!scope1 && /scope\s*1/.test(label)) scope1 = `${value} tCO2e`;
    if (!scope2 && /scope\s*2/.test(label)) scope2 = `${value} tCO2e`;
    if (!scope3 && /scope\s*3/.test(label)) scope3 = `${value} tCO2e`;
  }
  return { scope1, scope2, scope3 };
}

function extractTargets(org: Record<string, unknown>): string[] {
  const targets: string[] = [];
  const doc = org.document_reduction_targets;
  const sbti = org.sbti_reduction_targets;
  for (const block of [doc, sbti]) {
    if (!Array.isArray(block)) continue;
    for (const item of block.slice(0, 6)) {
      const row = asRecord(item);
      const sentence =
        str(row.target) ||
        str(row.description) ||
        str(row.name) ||
        [str(row.scope), str(row.year), str(row.percent)].filter(Boolean).join(" · ");
      if (sentence) targets.push(sentence);
    }
  }
  return targets;
}

export function normalizeOrganization(payload: unknown, fallbackName: string): ClimateProfile {
  const org = asRecord(payload);
  const matching = asRecord(org.matching_organization);
  const industry = asRecord(org.industry);
  const scopes = extractScopes(org);
  const score01 = num(org.score);

  return {
    name: str(org.name) || str(matching.name) || fallbackName,
    website: str(org.website),
    hqRegion: str(org.hq_region),
    industry: str(industry.name),
    carbonRiskScore: scoreTo100(score01),
    industryPercentile: num(org.industry_score_percentile),
    industryRank: num(org.industry_rank),
    regionRank: num(org.region_rank),
    industryMeanScore: scoreTo100(num(industry.mean_score)),
    profileUrl: str(matching.link) || str(org.link),
    organizationId: num(org.id) ?? num(matching.id),
    initiatives: mapInitiatives(org.initiatives),
    reductionActionPresent:
      typeof org.reduction_action_present === "boolean" ? org.reduction_action_present : null,
    scope1: scopes.scope1,
    scope2: scopes.scope2,
    scope3: scopes.scope3,
    reductionTargets: extractTargets(org),
    raw: payload,
  };
}

export async function fetchSbtiCompanies(params: {
  company_name?: string;
  isin?: string;
  lei?: string;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params.company_name) qs.set("company_name", params.company_name);
  if (params.isin) qs.set("isin", params.isin);
  if (params.lei) qs.set("lei", params.lei);
  qs.set("page", String(params.page ?? 1));

  const result = await ditchFetch(`/sbti_companies?${qs.toString()}`);
  if (!result.ok) {
    return {
      status: {
        keyConfigured: hasApiKey(),
        source: hasApiKey() ? ("unavailable" as const) : ("illustrative" as const),
        message: result.error || "SBTi request failed",
        httpStatus: result.status || undefined,
      },
      rows: [] as SbtiSnapshot[],
      raw: result.data,
    };
  }

  // Response may be a bare array or a paginated envelope
  const data = result.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data).data)
      ? (asRecord(data).data as unknown[])
      : Array.isArray(asRecord(data).results)
        ? (asRecord(data).results as unknown[])
        : [data];

  const rows: SbtiSnapshot[] = [];
  for (const entry of list) {
    const org = asRecord(entry);
    const sbtiRows = Array.isArray(org.sbti_rows) ? org.sbti_rows : [org];
    for (const item of sbtiRows) {
      const r = asRecord(item);
      rows.push({
        companyName: str(r.company_name) || (Array.isArray(org.names) ? str(org.names[0]) : null),
        isin: str(r.isin),
        lei: str(r.lei),
        nearTermStatus: str(r.near_term_target_status),
        nearTermClassification: str(r.near_term_target_classification),
        nearTermYear: str(r.near_term_target_year),
        longTermStatus: str(r.long_term_target_status),
        longTermClassification: str(r.long_term_target_classification),
        longTermYear: str(r.long_term_target_year),
        netZeroCommitted: str(r.net_zero_committed),
        netZeroYear: str(r.net_zero_year),
        sector: str(r.sector),
        location: str(r.location),
      });
    }
  }

  return {
    status: {
      keyConfigured: true,
      source: "live" as const,
      message: rows.length
        ? `Live SBTi snapshot (${rows.length} row${rows.length === 1 ? "" : "s"}).`
        : "Live SBTi call succeeded but returned no matching rows.",
      httpStatus: result.status,
    },
    rows,
    raw: result.data,
  };
}

export async function fetchCompanyClimateProfile(input: {
  name: string;
  website?: string;
  hq_region?: string;
  isin_number?: string;
  lei_number?: string;
  duns_number?: string;
  external_id?: string;
}) {
  if (!hasApiKey()) {
    return {
      status: {
        keyConfigured: false,
        source: "illustrative" as const,
        message: "No DITCHCARBON_API_KEY — using illustrative profile data.",
      },
      profile: null as ClimateProfile | null,
      raw: null,
    };
  }

  const body: Record<string, string> = { name: input.name };
  if (input.website) body.website = input.website;
  if (input.hq_region) body.hq_region = input.hq_region;
  if (input.isin_number) body.isin_number = input.isin_number;
  if (input.lei_number) body.lei_number = input.lei_number;
  if (input.duns_number) body.duns_number = input.duns_number;
  if (input.external_id) body.external_id = input.external_id;

  const posted = await ditchFetch("/organizations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!posted.ok) {
    return {
      status: {
        keyConfigured: true,
        source: "unavailable" as const,
        message: posted.error || "Organization register/profile call failed",
        httpStatus: posted.status || undefined,
      },
      profile: null as ClimateProfile | null,
      raw: posted.data,
    };
  }

  let payload = posted.data;
  const id = num(asRecord(posted.data).id);
  // Prefer GET detail when we have an id (may include more fields on higher plans)
  if (id != null) {
    const detailed = await ditchFetch(`/organizations/${id}`);
    if (detailed.ok) payload = detailed.data;
  }

  return {
    status: {
      keyConfigured: true,
      source: "live" as const,
      message: "Live company climate profile from POST /organizations.",
      httpStatus: posted.status,
    },
    profile: normalizeOrganization(payload, input.name),
    raw: payload,
  };
}
