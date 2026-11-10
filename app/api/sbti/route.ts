import { NextRequest } from "next/server";
import { fetchSbtiCompanies, hasApiKey } from "@/app/lib/ditchcarbon-client";
import { getDemoSupplier } from "@/app/lib/demo-suppliers";

export const dynamic = "force-dynamic";

/** Illustrative SBTi-shaped rows when no key / upstream miss */
function illustrativeSbti(name: string) {
  const demo = getDemoSupplier(name);
  const strong = (demo?.illustrativeScore ?? 50) >= 70;
  return [
    {
      companyName: demo?.name || name,
      isin: demo?.isin || null,
      lei: demo?.lei || null,
      nearTermStatus: strong ? "Targets Set" : "Committed",
      nearTermClassification: strong ? "1.5°C" : "Well-below 2°C",
      nearTermYear: strong ? "2030" : "2032",
      longTermStatus: strong ? "Targets Set" : null,
      longTermClassification: strong ? "1.5°C" : null,
      longTermYear: strong ? "2040" : null,
      netZeroCommitted: strong ? "Yes" : "No",
      netZeroYear: strong ? "2040" : null,
      sector: demo?.industry || null,
      location: demo?.hqRegion || null,
    },
  ];
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const company_name = sp.get("company_name") || sp.get("name") || "";
  const isin = sp.get("isin") || undefined;
  const lei = sp.get("lei") || undefined;

  if (!company_name && !isin && !lei) {
    return Response.json({ error: "Provide company_name, isin, or lei" }, { status: 400 });
  }

  const live = await fetchSbtiCompanies({ company_name: company_name || undefined, isin, lei });
  if (live.status.source === "live" && live.rows.length) {
    return Response.json({
      status: live.status,
      keyConfigured: hasApiKey(),
      rows: live.rows,
    });
  }

  return Response.json({
    status: {
      keyConfigured: hasApiKey(),
      source: "illustrative",
      message: live.status.message || "Illustrative SBTi row — live data unavailable.",
      httpStatus: live.status.httpStatus,
    },
    keyConfigured: hasApiKey(),
    rows: illustrativeSbti(company_name || "Unknown"),
  });
}
