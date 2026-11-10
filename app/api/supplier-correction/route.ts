import { NextRequest } from "next/server";
import { fetchCompanyClimateProfile, hasApiKey } from "@/app/lib/ditchcarbon-client";
import { illustrativeProfile } from "@/app/lib/illustrative-profiles";
import { normalizeDisclosureText } from "@/app/lib/normalize-disclosure";

export const dynamic = "force-dynamic";

/**
 * Supplier self-correction: accept pasted primary report text (PDF text mock),
 * extract fields, and queue a review — score does NOT inflate on upload.
 */
export async function POST(request: NextRequest) {
  let body: { supplier?: string; text?: string; fileName?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supplier = body.supplier?.trim();
  const text = body.text?.trim();
  if (!supplier || !text) {
    return Response.json({ error: "supplier and text are required" }, { status: 400 });
  }

  const live = await fetchCompanyClimateProfile({ name: supplier });
  const baseline =
    live.profile && live.status.source === "live" ? live.profile : illustrativeProfile(supplier);

  const extracted = normalizeDisclosureText(
    text,
    body.fileName ? `Supplier upload: ${body.fileName}` : "Supplier primary upload",
  );

  const submittedAt = new Date().toISOString();
  const requestId = `SCR-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  return Response.json({
    keyConfigured: hasApiKey(),
    baselineStatus: live.status,
    baseline: {
      carbonRiskScore: baseline.carbonRiskScore,
      source: live.status.source,
      initiatives: baseline.initiatives,
      reductionTargets: baseline.reductionTargets,
    },
    extracted,
    review: {
      status: "primary_data_under_review",
      statusLabel: "Primary data under review",
      recalculationStatus: "queued",
      recalculationLabel: "Recalculating via API",
      requestId,
      submittedAt,
      scoreUnchanged: true,
      currentScore: baseline.carbonRiskScore,
    },
    note:
      "Upload accepted. The published Supplier Climate Score stays at the baseline until review finishes and the climate-profile API returns a refreshed value — this demo does not invent an instant higher score.",
    whatHappensNext: [
      "CS / data ops spot-checks extracted Scope 1–3 fields against the uploaded text.",
      "A recalculation job is queued against the climate-profile API (request ID above).",
      "The score updates only when that job completes — typically a CS follow-up, not an instant greenwash bump.",
      "Until then, buyers should treat the baseline score as current and this upload as pending primary evidence.",
    ],
  });
}
