import { hasApiKey } from "@/app/lib/ditchcarbon-client";
import { loadGithubFeeds } from "@/app/lib/github-feeds";

export async function HomeFeeds() {
  const keyConfigured = hasApiKey();
  const feeds = await loadGithubFeeds();

  return (
    <>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {feeds.map((f) => (
          <div key={f.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{f.label}</span>
              <span
                className={`chip ${
                  f.status === "live"
                    ? "chip-live"
                    : f.status === "fallback"
                      ? "chip-illust"
                      : "chip-missing"
                }`}
              >
                {f.status}
              </span>
            </div>
            <p className="mt-1 text-[var(--muted)]">{f.detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        {keyConfigured
          ? "DITCHCARBON_API_KEY is configured for live enrichment on Scorecard, Buy moment, and Supplier correction."
          : "No API key in this environment — those demos use illustrative fallbacks. Gap checker runs fully in-browser either way."}
      </p>
    </>
  );
}

export function HomeFeedsFallback() {
  return (
    <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading feed status">
      <div className="h-14 animate-pulse rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--border)_35%,transparent)]" />
      <div className="h-14 animate-pulse rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--border)_35%,transparent)]" />
      <div className="h-3 w-3/4 max-w-md animate-pulse rounded bg-[var(--border)]" />
    </div>
  );
}
