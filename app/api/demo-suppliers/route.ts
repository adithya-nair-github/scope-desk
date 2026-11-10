import { DEMO_SUPPLIERS } from "@/app/lib/demo-suppliers";
import { hasApiKey } from "@/app/lib/ditchcarbon-client";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    keyConfigured: hasApiKey(),
    suppliers: DEMO_SUPPLIERS,
    trialNote:
      "Up to ~10 prefilled suppliers for free-trial style testing. Live scores require DITCHCARBON_API_KEY.",
  });
}
