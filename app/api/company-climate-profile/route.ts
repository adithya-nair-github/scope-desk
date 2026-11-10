import { NextRequest } from "next/server";
import { fetchCompanyClimateProfile, hasApiKey } from "@/app/lib/ditchcarbon-client";
import { getDemoSupplier } from "@/app/lib/demo-suppliers";
import { illustrativeProfile } from "@/app/lib/illustrative-profiles";

export const dynamic = "force-dynamic";

function pick(input: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const name = sp.get("name") || sp.get("supplier") || "";
  return respond({
    name,
    website: sp.get("website") || undefined,
    hq_region: sp.get("hq_region") || undefined,
    isin_number: sp.get("isin") || sp.get("isin_number") || undefined,
    lei_number: sp.get("lei") || sp.get("lei_number") || undefined,
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  return respond({
    name: pick(body, ["name", "supplier", "companyName", "company_name"]),
    website: pick(body, ["website"]) || undefined,
    hq_region: pick(body, ["hq_region", "hqRegion"]) || undefined,
    isin_number: pick(body, ["isin_number", "isin"]) || undefined,
    lei_number: pick(body, ["lei_number", "lei"]) || undefined,
    duns_number: pick(body, ["duns_number", "duns"]) || undefined,
    external_id: pick(body, ["external_id", "externalId"]) || undefined,
  });
}

async function respond(input: {
  name: string;
  website?: string;
  hq_region?: string;
  isin_number?: string;
  lei_number?: string;
  duns_number?: string;
  external_id?: string;
}) {
  if (!input.name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const demo = getDemoSupplier(input.name);
  const enriched = {
    name: demo?.name || input.name,
    website: input.website || demo?.website,
    hq_region: input.hq_region || demo?.hqRegion,
    isin_number: input.isin_number || demo?.isin,
    lei_number: input.lei_number || demo?.lei,
    duns_number: input.duns_number,
    external_id: input.external_id || demo?.id,
  };

  const live = await fetchCompanyClimateProfile(enriched);
  if (live.profile && live.status.source === "live") {
    return Response.json({
      ...live.profile,
      status: live.status,
      keyConfigured: hasApiKey(),
      attribution:
        "Climate score data retrieved via Ditch Carbon API for this independent demo. Not an official product.",
    });
  }

  const fallback = illustrativeProfile(enriched.name);
  return Response.json({
    ...fallback,
    status: {
      keyConfigured: hasApiKey(),
      source: "illustrative" as const,
      message: live.status.message || "Using illustrative profile.",
      httpStatus: live.status.httpStatus,
    },
    keyConfigured: hasApiKey(),
    attribution: "Illustrative sample profile — label shown because live API data was unavailable.",
  });
}
