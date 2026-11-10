/**
 * Live GitHub-hosted data tuning (Carbon Trail pattern):
 * try raw.githubusercontent.com first, fall back to local cache.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

export type GithubFeedResult = {
  id: string;
  label: string;
  url: string;
  status: "live" | "fallback" | "error";
  detail: string;
  payload: unknown;
};

const FEEDS = [
  {
    id: "quantified-fashion",
    label: "Quantified fashion catalog (GitHub)",
    url: "https://raw.githubusercontent.com/tass-gb/Quantifying-sustainability-in-fashion-/main/README.md",
    fallback: "github-cache/quantified-fashion-note.json",
  },
  {
    id: "ghg-protocol-note",
    label: "Local GHG Protocol scope map (cache)",
    url: "",
    fallback: "github-cache/ghg-scope-map.json",
  },
];

async function readFallback(rel: string) {
  const file = path.join(process.cwd(), "app/lib", rel);
  return JSON.parse(await readFile(file, "utf8"));
}

export async function loadGithubFeeds(): Promise<GithubFeedResult[]> {
  const out: GithubFeedResult[] = [];

  for (const feed of FEEDS) {
    if (!feed.url) {
      try {
        const payload = await readFallback(feed.fallback);
        out.push({
          id: feed.id,
          label: feed.label,
          url: feed.fallback,
          status: "fallback",
          detail: "Served from local cache (no remote URL for this feed).",
          payload,
        });
      } catch (error) {
        out.push({
          id: feed.id,
          label: feed.label,
          url: feed.fallback,
          status: "error",
          detail: error instanceof Error ? error.message : "Cache read failed",
          payload: null,
        });
      }
      continue;
    }

    try {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "ScopeDesk-portfolio-prototype" },
        signal: AbortSignal.timeout(12000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`GitHub raw HTTP ${response.status}`);
      const text = await response.text();
      out.push({
        id: feed.id,
        label: feed.label,
        url: feed.url,
        status: "live",
        detail: `Fetched live from GitHub raw (${text.length.toLocaleString()} chars).`,
        payload: { preview: text.slice(0, 500), bytes: text.length },
      });
    } catch (error) {
      try {
        const payload = await readFallback(feed.fallback);
        out.push({
          id: feed.id,
          label: feed.label,
          url: feed.url,
          status: "fallback",
          detail: `Live GitHub fetch failed (${error instanceof Error ? error.message : "error"}); using local cache.`,
          payload,
        });
      } catch {
        out.push({
          id: feed.id,
          label: feed.label,
          url: feed.url,
          status: "error",
          detail: error instanceof Error ? error.message : "Fetch failed",
          payload: null,
        });
      }
    }
  }

  return out;
}
