"use client";

import { useEffect, useState } from "react";
import { StatusBanner } from "../components/StatusBanner";

type Supplier = { id: string; name: string; illustrativeScore: number };

type CorrectionResponse = {
  keyConfigured: boolean;
  baselineStatus: { source?: string; message?: string };
  baseline: { carbonRiskScore: number | null };
  extracted: {
    fieldCount: number;
    fields: Array<{ label: string; value: string; evidenceSnippet: string; ghgBucket: string }>;
  };
  review: {
    status: string;
    statusLabel: string;
    recalculationStatus: string;
    recalculationLabel: string;
    requestId: string;
    submittedAt: string;
    scoreUnchanged: boolean;
    currentScore: number | null;
  };
  note: string;
  whatHappensNext: string[];
  error?: string;
};

const DEFAULT_UPLOAD = `Northwind Packaging Co — Primary GHG inventory (supplier upload, illustrative)

Reporting year 2024. Boundary: owned manufacturing sites (operational control).

Total Scope 1 emissions 2,140 tCO2e from natural gas boilers.
Total Scope 2 emissions 5,880 tCO2e (market-based). 41% of sourced electricity was renewable.
Total Scope 3 emissions 28,500 tCO2e.
Purchased goods and services 21,200 tCO2e
Upstream transportation and distribution 4,100 tCO2e
Business travel 620 tCO2e

We have committed to evaluate science-based targets with SBTi and aim for net-zero by 2045.`;

export default function SupplierPortalPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("indie-pack");
  const [text, setText] = useState(DEFAULT_UPLOAD);
  const [fileName, setFileName] = useState("northwind-primary-ghg.txt");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CorrectionResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/demo-suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers || []))
      .catch(() => undefined);
  }, []);

  const supplierName = suppliers.find((s) => s.id === supplierId)?.name || "Northwind Packaging Co";

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/supplier-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier: supplierName, text, fileName }),
      });
      const data = (await res.json()) as CorrectionResponse;
      if (!res.ok) throw new Error(data.error || "Upload processing failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function onFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result || ""));
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Supplier self-correction portal</h1>
        <p className="max-w-3xl text-[var(--muted)]">
          For suppliers whose automated Supplier Climate Score looks thin because public data is
          missing. Upload primary emissions text to queue a review — the published score stays put
          until recalculation finishes. No instant score inflation.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <section className="surface space-y-4 p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Your supplier record</span>
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Upload primary report (text / PDF-as-text mock)</span>
            <input
              type="file"
              accept=".txt,.csv,.md,text/plain"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Report text</span>
            <textarea
              className="prose-mono min-h-[16rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>

          <button
            type="button"
            disabled={loading || !text.trim()}
            onClick={submit}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Submitting for review…" : "Submit primary disclosure"}
          </button>
          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <section className="surface space-y-4 p-4">
          <h2 className="font-display text-xl font-semibold">Upload status</h2>
          {!result ? (
            <p className="text-sm text-[var(--muted)]">
              Submit a disclosure to queue primary-data review. The baseline score will not jump on
              upload.
            </p>
          ) : (
            <>
              <StatusBanner
                source={result.baselineStatus.source}
                message={result.baselineStatus.message}
                keyConfigured={result.keyConfigured}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Current score</p>
                  <p className="mt-2 text-4xl font-bold">{result.baseline.carbonRiskScore ?? "—"}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Unchanged until API refresh</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-center">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">After upload</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--warn)]">
                    {result.review.statusLabel}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{result.review.recalculationLabel}</p>
                </div>
              </div>

              <dl className="grid gap-2 rounded-lg border border-[var(--border)] p-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Request ID</dt>
                  <dd className="font-mono text-[var(--text)]">{result.review.requestId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Queued at</dt>
                  <dd className="tabular-nums text-[var(--text)]">
                    {new Date(result.review.submittedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="font-semibold">What happens next</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {result.whatHappensNext.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="text-sm">
                <p className="font-semibold">Extracted fields pending review ({result.extracted.fieldCount})</p>
                <ul className="mt-2 space-y-2">
                  {result.extracted.fields.map((f) => (
                    <li key={f.label + f.value} className="rounded-lg border border-[var(--border)] p-2">
                      <div className="flex justify-between gap-2">
                        <span>
                          {f.ghgBucket}: {f.label}
                        </span>
                        <span className="font-semibold text-[var(--accent)]">{f.value}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">“{f.evidenceSnippet}”</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-[var(--muted)]">{result.note}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
