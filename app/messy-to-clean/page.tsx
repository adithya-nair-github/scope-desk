"use client";

import { useMemo, useState } from "react";
import { StatusBanner } from "../components/StatusBanner";

type NormalizeResponse = {
  companyName: string | null;
  disclaimer: string | null;
  sourceLabel: string;
  rawText: string;
  normalized: {
    fieldCount: number;
    note: string;
    fields: Array<{
      id: string;
      label: string;
      ghgBucket: string;
      value: string;
      evidenceSnippet: string;
      sourceLabel: string;
    }>;
    byBucket: Record<string, unknown[]>;
  };
  enrichment: {
    keyConfigured: boolean;
    profile: {
      carbonRiskScore: number | null;
      industry: string | null;
      industryMeanScore?: number | null;
      industryPercentile?: number | null;
      reductionTargets: string[];
      initiatives: Record<string, boolean | null>;
      scope1?: string | null;
      scope2?: string | null;
      scope3?: string | null;
      status?: { source?: string; message?: string };
    } | null;
    sbti: {
      status: { source?: string; message?: string };
      rows: Array<Record<string, string | null>>;
    } | null;
  };
  error?: string;
};

const SAMPLES = [
  { id: "hm-group", label: "H&M Group–style (illustrative)" },
  { id: "arvind", label: "Arvind Ltd–style (illustrative)" },
  { id: "indie-pack", label: "Sparse SME (illustrative)" },
];

function availabilityLabel(
  fields: NormalizeResponse["normalized"]["fields"],
  bucket: string,
  profileHint?: string | null,
) {
  const count = fields.filter((f) => f.ghgBucket === bucket).length;
  if (count > 0) return { label: "Available", detail: `${count} figure(s) in disclosure`, tone: "live" as const };
  if (profileHint) return { label: "Profile signal", detail: "From Supplier Climate Score enrichment", tone: "illust" as const };
  return { label: "Not found", detail: "No Scope figure in this disclosure", tone: "missing" as const };
}

export default function MessyToCleanPage() {
  const [sampleId, setSampleId] = useState("hm-group");
  const [companyName, setCompanyName] = useState("H&M Group");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalizeResponse | null>(null);
  const [error, setError] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);

  const buckets = useMemo(
    () => ["Scope 1", "Scope 2", "Scope 3", "Energy", "Target"] as const,
    [],
  );

  async function run(useSample: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/normalize-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          useSample
            ? { sampleId, companyName }
            : { text: customText, companyName },
        ),
      });
      const data = (await res.json()) as NormalizeResponse;
      if (!res.ok) throw new Error(data.error || "Scorecard load failed");
      setResult(data);
      setAuditOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const profile = result?.enrichment.profile;
  const sbtiRow = result?.enrichment.sbti?.rows?.[0];
  const score = profile?.carbonRiskScore ?? null;
  const industryMean = profile?.industryMeanScore ?? 62;
  const vsIndustry =
    score == null ? null : score - industryMean;

  const scope1 = result
    ? availabilityLabel(result.normalized.fields, "Scope 1", profile?.scope1)
    : null;
  const scope2 = result
    ? availabilityLabel(result.normalized.fields, "Scope 2", profile?.scope2)
    : null;
  const scope3 = result
    ? availabilityLabel(result.normalized.fields, "Scope 3", profile?.scope3)
    : null;

  const sbtiNearTerm = sbtiRow?.nearTermStatus || null;
  const sbtiNetZero = sbtiRow?.netZeroCommitted || null;
  const sbtiCommitted =
    Boolean(profile?.initiatives?.sbti) ||
    (sbtiNearTerm != null && sbtiNearTerm !== "—" && sbtiNearTerm.toLowerCase() !== "none");

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          For CS and procurement — when a buyer asks “can we trust this supplier’s climate posture?”
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Supplier scorecard
        </h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Break a Supplier Climate Score into the components a kickoff call needs: Scope 1 / 2 / 3
          availability, SBTi commitment, and how the score sits vs industry average. Use the
          traceability audit only when compliance needs a cited snippet.
        </p>
      </header>

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Supplier sample</span>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2"
            value={sampleId}
            onChange={(e) => {
              setSampleId(e.target.value);
              const map: Record<string, string> = {
                "hm-group": "H&M Group",
                arvind: "Arvind Ltd",
                "indie-pack": "Northwind Packaging Co",
              };
              setCompanyName(map[e.target.value] || "");
            }}
          >
            {SAMPLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Supplier name (for live enrichment)</span>
          <input
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(true)}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Building scorecard…" : "Load scorecard"}
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-3 py-2 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {!result ? (
        <section className="surface p-6">
          <p className="text-sm text-[var(--muted)]">
            Load a sample supplier to see the climate scorecard a CS person can walk on a call —
            components first, raw disclosure second.
          </p>
        </section>
      ) : (
        <>
          <section className="surface space-y-5 p-5" aria-labelledby="scorecard-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 id="scorecard-title" className="font-display text-xl font-semibold">
                  {result.companyName || companyName || "Supplier"} climate scorecard
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {profile?.industry || "Industry n/a"} · for buyer diligence, not engineering debug
                </p>
              </div>
              {profile ? (
                <StatusBanner
                  source={profile.status?.source}
                  message={profile.status?.message}
                  keyConfigured={result.enrichment.keyConfigured}
                />
              ) : null}
            </div>

            {result.disclaimer ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--warn)]">
                {result.disclaimer}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-6">
              <div className="score-ring">{score ?? "—"}</div>
              <div className="min-w-[12rem] flex-1 space-y-1">
                <p className="font-semibold">Supplier Climate Score</p>
                <p className="text-sm text-[var(--muted)]">
                  Composite signal. Breakdown below is what you explain on the call.
                </p>
                {vsIndustry != null ? (
                  <p className="text-sm">
                    vs industry average ({industryMean}):{" "}
                    <span className="font-semibold text-[var(--accent)]">
                      {vsIndustry >= 0 ? "+" : ""}
                      {vsIndustry} pts
                    </span>
                    {profile?.industryPercentile != null
                      ? ` · ~${profile.industryPercentile}th percentile`
                      : null}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Score components
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Scope 1 availability", ...scope1! },
                  { title: "Scope 2 availability", ...scope2! },
                  { title: "Scope 3 availability", ...scope3! },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span
                        className={`chip ${
                          item.tone === "live"
                            ? "chip-live"
                            : item.tone === "illust"
                              ? "chip-illust"
                              : "chip-missing"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">{item.detail}</p>
                  </div>
                ))}

                <div className="rounded-lg border border-[var(--border)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">SBTi commitment</p>
                    <span className={`chip ${sbtiCommitted ? "chip-live" : "chip-missing"}`}>
                      {sbtiCommitted ? "On record" : "Not found"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Near-term: {sbtiNearTerm || "—"}
                    {sbtiRow?.nearTermClassification ? ` · ${sbtiRow.nearTermClassification}` : ""}
                    {sbtiRow?.nearTermYear ? ` · ${sbtiRow.nearTermYear}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Net-zero: {sbtiNetZero || "—"} {sbtiRow?.netZeroYear || ""}
                  </p>
                  {result.enrichment.sbti ? (
                    <div className="mt-2">
                      <StatusBanner
                        source={result.enrichment.sbti.status.source}
                        message={result.enrichment.sbti.status.message}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-[var(--border)] p-3 sm:col-span-2 lg:col-span-2">
                  <p className="text-sm font-medium">Industry average comparison</p>
                  <div className="mt-3 flex items-end gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">This supplier</p>
                      <p className="text-2xl font-semibold tabular-nums">{score ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Industry mean</p>
                      <p className="text-2xl font-semibold tabular-nums text-[var(--muted)]">
                        {industryMean}
                      </p>
                    </div>
                    <p className="mb-1 text-sm text-[var(--muted)]">
                      {!result.enrichment.keyConfigured
                        ? "Illustrative industry mean used when no API key is configured."
                        : "Industry context from climate profile enrichment."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {profile?.reductionTargets?.length ? (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Targets buyers can cite
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {profile.reductionTargets.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="surface overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => setAuditOpen((o) => !o)}
              aria-expanded={auditOpen}
            >
              <div>
                <h2 className="font-display text-lg font-semibold">Traceability audit</h2>
                <p className="text-sm text-[var(--muted)]">
                  Secondary — for compliance when someone asks “show me the disclosure line.”
                </p>
              </div>
              <span className="text-sm text-[var(--accent)]">{auditOpen ? "Hide" : "Open"}</span>
            </button>

            {auditOpen ? (
              <div className="grid gap-4 border-t border-[var(--border)] p-4 lg:grid-cols-2">
                <div className="flex min-h-[20rem] flex-col overflow-hidden rounded-lg border border-[var(--border)]">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <h3 className="font-semibold">Source disclosure</h3>
                    <p className="text-xs text-[var(--muted)]">
                      Paste alternate text if you need a custom audit trail
                    </p>
                  </div>
                  <textarea
                    className="prose-mono min-h-[16rem] flex-1 resize-y border-0 bg-transparent px-4 py-3 text-[var(--text)] outline-none"
                    placeholder="Paste sustainability report text here…"
                    value={result.rawText ?? customText}
                    onChange={(e) => {
                      setCustomText(e.target.value);
                      setResult(null);
                    }}
                  />
                  <div className="flex gap-2 border-t border-[var(--border)] p-3">
                    <button
                      type="button"
                      disabled={loading || !customText.trim()}
                      onClick={() => run(false)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--accent)]"
                    >
                      Re-run from pasted text
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border)]">
                  <div className="border-b border-[var(--border)] px-4 py-3">
                    <h3 className="font-semibold">Normalized fields + citations</h3>
                    <p className="text-xs text-[var(--muted)]">
                      {result.normalized.fieldCount} fields · {result.normalized.note}
                    </p>
                  </div>
                  <div className="max-h-[24rem] space-y-4 overflow-auto p-4">
                    {buckets.map((bucket) => {
                      const fields = result.normalized.fields.filter((f) => f.ghgBucket === bucket);
                      return (
                        <div key={bucket}>
                          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                            {bucket}
                          </h4>
                          {!fields.length ? (
                            <p className="chip chip-missing">No figure stated in excerpt</p>
                          ) : (
                            <ul className="space-y-2">
                              {fields.map((f) => (
                                <li key={f.id} className="rounded-lg border border-[var(--border)] p-3">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="font-medium">{f.label}</span>
                                    <span className="font-semibold text-[var(--accent)]">{f.value}</span>
                                  </div>
                                  <p className="mt-2 text-xs text-[var(--muted)]">
                                    <span className="font-semibold text-[var(--text)]">Citation: </span>
                                    “{f.evidenceSnippet}”
                                  </p>
                                  <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                                    Source · {f.sourceLabel}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
