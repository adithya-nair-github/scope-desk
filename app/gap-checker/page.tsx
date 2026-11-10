"use client";

/**
 * Hero CS onboarding tool — CSV never leaves the browser.
 * Maps spend rows to GHG Protocol Scope 3 categories and scores data readiness
 * by spend impact (not tonnes CO₂e).
 */

import { useEffect, useMemo, useState } from "react";
import {
  SCOPE3,
  buildPlan,
  computeCoverage,
  computeFlags,
  parseCsv,
  planAsMarkdown,
  type SpendRow,
} from "@/app/lib/gap-checker";
import { SAMPLE_SPEND_CSV, SAMPLE_SPEND_LABEL } from "@/app/lib/sample-spend";

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

export default function GapCheckerPage() {
  const [rows, setRows] = useState<SpendRow[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  function ingest(text: string, sample: boolean) {
    setRows(parseCsv(text));
    setIsSample(sample);
    setError("");
  }

  function loadSample() {
    try {
      ingest(SAMPLE_SPEND_CSV, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load illustrative sample data");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sample") === "1" || params.get("sample") === "true") {
      loadSample();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for homepage CTA
  }, []);

  function onFile(file: File | null) {
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        ingest(String(reader.result || ""), false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bad CSV");
        setRows([]);
      }
    };
    reader.readAsText(file);
  }

  const {
    coverage,
    readiness,
    categoryReadiness,
    totalSpend,
    spendUnderCoverage,
    uncoveredSpend,
    unmappedSpend,
  } = useMemo(() => computeCoverage(rows), [rows]);
  const flags = useMemo(() => computeFlags(rows), [rows]);
  const plan = useMemo(() => buildPlan(rows), [rows]);

  const coverageSorted = useMemo(
    () => [...coverage].sort((a, b) => b.spend - a.spend || a.cat.localeCompare(b.cat)),
    [coverage],
  );

  async function copyPlan() {
    const text = planAsMarkdown(rows);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied structured Markdown to clipboard.");
    } catch {
      setCopyStatus("Could not copy — select the plan text manually.");
    }
    setTimeout(() => setCopyStatus(""), 2500);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          For the first onboarding call — after the customer drops a supplier spend spreadsheet.
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Scope 3 onboarding gap checker
        </h1>
        <p className="max-w-3xl text-[var(--muted)]">
          Messy supplier spend CSV → GHG Protocol category coverage weighted by dollars. Data-readiness
          only — not an emissions calculator.
        </p>
      </header>

      <div className="surface flex flex-wrap items-center gap-3 p-4">
        <label className="cursor-pointer rounded-lg border border-dashed border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          Choose CSV
        </label>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Use sample data
        </button>
        {isSample ? <span className="chip chip-illust">{SAMPLE_SPEND_LABEL}</span> : null}
        <p className="basis-full text-xs text-[var(--muted)]">CSV stays in your browser.</p>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {rows.length && isSample ? (
        <p className="text-sm text-[var(--muted)]" role="status">
          Loaded {rows.length} fictional supplier rows. Showing mapping, spend-weighted gaps, quality
          flags, and a first-30-days plan.
        </p>
      ) : null}

      {rows.length ? (
        <>
          <section className="surface overflow-x-auto" aria-labelledby="mapping-title">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 id="mapping-title" className="font-display text-lg font-semibold">
                Map rows to Scope 3 categories
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Keyword rules suggest a category — change any row with the dropdown.
              </p>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Spend</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Mapped Scope 3</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border)]">
                    <td className="p-3">{r.supplier}</td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">{r.spend == null ? "—" : money(r.spend)}</td>
                    <td className="p-3">{r.country || "—"}</td>
                    <td className="p-3">
                      <select
                        className="w-full max-w-xs rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
                        value={r.mapped}
                        onChange={(e) => {
                          const next = [...rows];
                          next[i] = { ...r, mapped: e.target.value };
                          setRows(next);
                        }}
                      >
                        {SCOPE3.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="space-y-3" aria-labelledby="gap-title">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface p-4 sm:col-span-2 lg:col-span-1">
                <p className="text-sm text-[var(--muted)]">Spend-weighted readiness</p>
                <p className="text-4xl font-bold text-[var(--accent)]">{readiness}%</p>
                <p className="text-xs text-[var(--muted)]">
                  Data-readiness by dollar impact — not CO₂e. Category completeness: {categoryReadiness}%.
                </p>
              </div>
              <div className="surface p-4">
                <p className="text-sm text-[var(--muted)]">Spend under coverage</p>
                <p className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                  {money(spendUnderCoverage)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  of {money(totalSpend)} total in file
                </p>
              </div>
              <div className="surface p-4">
                <p className="text-sm text-[var(--muted)]">Uncovered spend</p>
                <p className="text-2xl font-bold tabular-nums text-[var(--warn)]">
                  {money(uncoveredSpend)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Missing / partial / unmapped dollars CS should chase
                </p>
              </div>
              <div className="surface p-4">
                <p className="text-sm text-[var(--muted)]">Unmapped spend</p>
                <p className="text-2xl font-bold tabular-nums">{money(unmappedSpend)}</p>
                <p className="text-xs text-[var(--muted)]">Rows still outside GHG Protocol buckets</p>
              </div>
            </div>

            <div className="surface overflow-x-auto">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h2 id="gap-title" className="font-display text-lg font-semibold">
                  Gap report — financial impact
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Sorted by spend. High-spend gaps hurt readiness more than empty low-spend categories.
                </p>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Rows</th>
                    <th className="p-3">Spend $</th>
                    <th className="p-3">Share</th>
                    <th className="p-3">Spend impact</th>
                    <th className="p-3">Covered $</th>
                  </tr>
                </thead>
                <tbody>
                  {coverageSorted.map((c) => (
                    <tr key={c.cat} className="border-b border-[var(--border)]">
                      <td className="p-3">{c.cat}</td>
                      <td className="p-3">
                        <span
                          className={`chip ${
                            c.status === "Data provided"
                              ? "chip-live"
                              : c.status === "Partial"
                                ? "chip-illust"
                                : "chip-missing"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">{c.rows}</td>
                      <td className="p-3 tabular-nums">{money(c.spend)}</td>
                      <td className="p-3">{c.share.toFixed(1)}%</td>
                      <td className="p-3">
                        <span
                          className={`chip ${
                            c.spendImpact === "High"
                              ? "chip-missing"
                              : c.spendImpact === "Med"
                                ? "chip-illust"
                                : "chip-live"
                          }`}
                        >
                          {c.spendImpact}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums">{money(c.coveredSpend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface p-4 space-y-3" aria-labelledby="flags-title">
            <div>
              <h2 id="flags-title" className="font-display text-lg font-semibold">
                Data quality flags
              </h2>
              <p className="text-sm text-[var(--muted)]">
                Missing spend, missing country, duplicates, and unmapped categories — with spend impact
                where known.
              </p>
            </div>
            {flags.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No quality flags on this file.</p>
            ) : (
              <ul className="space-y-3">
                {flags.map((f, i) => (
                  <li key={`${f.type}-${i}`} className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{f.label}</p>
                      {f.spendImpact && f.spendImpact !== "None" ? (
                        <span className="chip chip-illust">Spend impact: {f.spendImpact}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-[var(--muted)]">{f.detail}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Suggested fix:</span> {f.fix}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface p-4 space-y-4" aria-labelledby="plan-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="plan-title" className="font-display text-lg font-semibold">
                  First 30 days plan
                </h2>
                <p className="text-sm text-[var(--muted)]">
                  Structured Markdown task table for Jira/Asana — includes supplier, category, and spend
                  impact.
                </p>
              </div>
              <button
                type="button"
                onClick={copyPlan}
                className="rounded-lg border border-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)]"
              >
                Copy Markdown
              </button>
            </div>
            {copyStatus ? (
              <p className="text-sm text-[var(--muted)]" role="status">
                {copyStatus}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                    <th className="p-3">ID</th>
                    <th className="p-3">Week</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Impact</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Task</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.tasks.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)] align-top">
                      <td className="p-3 font-mono text-xs">{t.id}</td>
                      <td className="p-3 whitespace-nowrap">{t.week}</td>
                      <td className="p-3">{t.supplier}</td>
                      <td className="p-3">{t.category}</td>
                      <td className="p-3">
                        <span className="chip chip-illust">{t.spendImpact}</span>
                      </td>
                      <td className="p-3 text-[var(--muted)]">{t.owner}</td>
                      <td className="p-3 text-[var(--muted)]">{t.task}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              {plan.weeks.map((w) => (
                <div key={w.title} className="border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
                  <h3 className="font-medium">{w.title}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{w.intro}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                    {w.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
