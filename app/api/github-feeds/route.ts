import { loadGithubFeeds } from "@/app/lib/github-feeds";

export const dynamic = "force-dynamic";

export async function GET() {
  const feeds = await loadGithubFeeds();
  return Response.json({
    feeds,
    pattern:
      "Carbon Trail–style live GitHub raw fetch with local cache fallback for disclosure / catalog tuning.",
  });
}
