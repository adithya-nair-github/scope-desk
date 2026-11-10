"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusBanner } from "../components/StatusBanner";

type Supplier = {
  id: string;
  name: string;
  website?: string;
  hqRegion?: string;
  isin?: string;
  industry: string;
  unitPriceUsd: number;
  leadTimeDays: number;
  illustrativeScore: number;
};

type Profile = {
  name: string;
  carbonRiskScore: number | null;
  industry: string | null;
  industryPercentile: number | null;
  reductionTargets: string[];
  initiatives: Record<string, boolean | null>;
  reductionActionPresent: boolean | null;
  profileUrl: string | null;
  status?: { source?: string; message?: string; keyConfigured?: boolean };
  attribution?: string;
};

export default function ProcurementPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [leftId, setLeftId] = useState("maersk");
  const [rightId, setRightId] = useState("dhl");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [keyConfigured, setKeyConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/demo-suppliers")
      .then((r) => r.json())
      .then((d) => {
        setSuppliers(d.suppliers || []);
        setKeyConfigured(Boolean(d.keyConfigured));
      })
      .catch(() => undefined);
  }, []);

  const left = useMemo(() => suppliers.find((s) => s.id === leftId), [suppliers, leftId]);
  const right = useMemo(() => suppliers.find((s) => s.id === rightId), [suppliers, rightId]);

  async function loadScores() {
    if (!left || !right) return;
    setLoading(true);
    try {
      const pair = [left, right];
      const results = await Promise.all(
        pair.map(async (s) => {
          const res = await fetch("/api/company-climate-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: s.name,
              website: s.website,
              hq_region: s.hqRegion,
              isin_number: s.isin,
              external_id: s.id,
            }),
          });
          return [s.id, (await res.json()) as Profile] as const;
        }),
      );
      setProfiles(Object.fromEntries(results));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (left && right) void loadScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left?.id, right?.id]);

  function coPilot(a?: Profile, b?: Profile, sa?: Supplier, sb?: Supplier) {
    if (!a || !b || !sa || !sb) return [] as string[];
    const tips: string[] = [];
    const saScore = a.carbonRiskScore ?? sa.illustrativeScore;
    const sbScore = b.carbonRiskScore ?? sb.illustrativeScore;
    const greener = saScore >= sbScore ? sa : sb;
    const greenerProfile = saScore >= sbScore ? a : b;
    const other = greener.id === sa.id ? sb : sa;
    tips.push(
      `${greener.name} leads on Supplier Climate Score (${Math.max(saScore, sbScore)} vs ${Math.min(saScore, sbScore)}). Prefer them unless price/risk gates force otherwise.`,
    );
    if (greenerProfile.initiatives?.sbti) {
      tips.push(`${greener.name} shows SBTi-related commitment signal — stronger engagement story for Category managers.`);
    }
    if (greenerProfile.reductionActionPresent) {
      tips.push(`Reduction action is on record for ${greener.name} — ask for evidence pack in the RFP appendix.`);
    }
    if (Math.abs(sa.unitPriceUsd - sb.unitPriceUsd) / Math.max(sa.unitPriceUsd, sb.unitPriceUsd) < 0.12) {
      tips.push(
        `Unit prices are within ~12%. Carbon can break the tie without a material cost hit versus ${other.name}.`,
      );
    } else {
      tips.push(
        `Price gap is material. Run a dual-award scenario: volume to ${greener.name} for greener lanes, remainder to the lower-cost option with a improvement clause.`,
      );
    }
    if (greenerProfile.reductionTargets?.length) {
      tips.push(`Co-pilot next ask: ${greenerProfile.reductionTargets[0]}`);
    }
    return tips;
  }

  const tips = coPilot(profiles[leftId], profiles[rightId], left, right);
  const leftScore = profiles[leftId]?.carbonRiskScore ?? left?.illustrativeScore;
  const rightScore = profiles[rightId]?.carbonRiskScore ?? right?.illustrativeScore;
  const greenerSide =
    leftScore != null && rightScore != null ? (leftScore >= rightScore ? "left" : "right") : null;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Procurement point-of-sale mock
        </h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Simulated enterprise sourcing screen: two competing vendors, unit price beside a Supplier
          Climate Score widget, plus a Reduction Co-Pilot. Live scores via{" "}
          <code>/api/company-climate-profile</code> when a key is present.
        </p>
      </header>

      <StatusBanner
        source={profiles[leftId]?.status?.source}
        message={
          profiles[leftId]?.status?.message ||
          (keyConfigured
            ? "Loading live profiles for selected vendors…"
            : "Illustrative scores until DITCHCARBON_API_KEY is set.")
        }
        keyConfigured={keyConfigured}
      />

      {/* Ariba-like chrome */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="ariba-chrome flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-white/70">Sourcing workspace</p>
            <p className="font-semibold">RFQ-2048 · Ocean freight lane · Q3 award</p>
          </div>
          <p className="text-xs text-white/70">Workflow mock · not affiliated with any vendor platform</p>
        </div>

        <div className="bg-[var(--bg-elev)] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium">Vendor A</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                value={leftId}
                onChange={(e) => setLeftId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium">Vendor B</span>
              <select
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                value={rightId}
                onChange={(e) => setRightId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={loadScores}
              disabled={loading}
              className="self-end rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh scores"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { side: "left" as const, s: left, p: profiles[leftId], score: leftScore },
              { side: "right" as const, s: right, p: profiles[rightId], score: rightScore },
            ].map(({ side, s, p, score }) => (
              <article
                key={side}
                className={`rounded-xl border p-4 ${
                  greenerSide === side
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{s?.name || "—"}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {s?.industry} · {s?.hqRegion || "HQ n/a"}
                    </p>
                  </div>
                  {greenerSide === side ? (
                    <span className="chip chip-live">Greener choice</span>
                  ) : null}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3">
                    <dt className="text-[var(--muted)]">Unit price</dt>
                    <dd className="text-xl font-semibold">
                      {s ? `$${s.unitPriceUsd.toLocaleString()}` : "—"}
                    </dd>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-3">
                    <dt className="text-[var(--muted)]">Lead time</dt>
                    <dd className="text-xl font-semibold">{s ? `${s.leadTimeDays}d` : "—"}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-3">
                  <div className="score-ring">{score ?? "—"}</div>
                  <div>
                    <p className="font-semibold">Supplier Climate Score</p>
                    <p className="text-xs text-[var(--muted)]">
                      {p?.status?.source === "live" ? "Live API" : "Illustrative / fallback"} ·
                      percentile {p?.industryPercentile ?? "n/a"}
                    </p>
                    {p?.profileUrl ? (
                      <a
                        className="text-xs font-semibold text-[var(--accent)]"
                        href={p.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Public profile link
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
            <h3 className="font-display text-lg font-semibold">Reduction Co-Pilot</h3>
            <p className="text-sm text-[var(--muted)]">
              Suggested actions at award time — how API-fed climate data changes the purchase decision.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              {tips.length ? tips.map((t) => <li key={t}>{t}</li>) : <li>Select two vendors to generate guidance.</li>}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
