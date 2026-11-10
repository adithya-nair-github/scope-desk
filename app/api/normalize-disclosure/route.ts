import { NextRequest } from "next/server";
import { fetchCompanyClimateProfile, fetchSbtiCompanies, hasApiKey } from "@/app/lib/ditchcarbon-client";
import { illustrativeProfile } from "@/app/lib/illustrative-profiles";
import { normalizeDisclosureText } from "@/app/lib/normalize-disclosure";
import { SAMPLE_DISCLOSURES } from "@/app/lib/sample-disclosures";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    text?: string;
    sampleId?: string;
    companyName?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let text = body.text?.trim() || "";
  let sourceLabel = "Pasted disclosure text";
  let companyName = body.companyName?.trim() || "";
  let disclaimer: string | null = null;

  if (body.sampleId && body.sampleId in SAMPLE_DISCLOSURES) {
    const sample = SAMPLE_DISCLOSURES[body.sampleId as keyof typeof SAMPLE_DISCLOSURES];
    text = sample.text;
    sourceLabel = sample.sourceLabel;
    companyName = companyName || sample.companyName;
    disclaimer = sample.disclaimer;
  }

  if (!text) {
    return Response.json({ error: "Provide text or sampleId" }, { status: 400 });
  }

  const normalized = normalizeDisclosureText(text, sourceLabel);

  // Enrich right panel with live SBTi + climate profile when possible
  const [sbti, profileLive] = await Promise.all([
    companyName
      ? fetchSbtiCompanies({ company_name: companyName })
      : Promise.resolve(null),
    companyName
      ? fetchCompanyClimateProfile({ name: companyName })
      : Promise.resolve(null),
  ]);

  const profile =
    profileLive?.profile && profileLive.status.source === "live"
      ? profileLive.profile
      : companyName
        ? illustrativeProfile(companyName)
        : null;

  return Response.json({
    companyName: companyName || null,
    disclaimer,
    sourceLabel,
    rawText: text,
    normalized,
    enrichment: {
      keyConfigured: hasApiKey(),
      profile: profile
        ? {
            ...profile,
            status: profileLive?.status || {
              keyConfigured: hasApiKey(),
              source: "illustrative",
              message: "Illustrative enrichment",
            },
          }
        : null,
      sbti: sbti
        ? {
            status: sbti.status,
            rows: sbti.rows.slice(0, 3),
          }
        : null,
    },
  });
}
