import Link from "next/link";
import { Suspense } from "react";
import { HomeFeeds, HomeFeedsFallback } from "./components/HomeFeeds";

const SAMPLE_ROWS = [
  { supplier: "Northwind Packaging Co", category: "office supplies", spend: "$125,000" },
  { supplier: "Helios Cloud Hosting", category: "IT services / SaaS", spend: "$890,000" },
  { supplier: "Riverbend Freight Ltd", category: "logistics and shipping", spend: "$340,000" },
  { supplier: "Summit Capital Equipment", category: "machinery purchase", spend: "$2,100,000" },
  { supplier: "Blue Harbor Hotels", category: "business travel hotels", spend: "$78,000" },
];

const FIRST_CALL_FINDINGS = [
  {
    label: "Mapped",
    detail: "Purchased goods, capital goods, freight, travel, and commuting show up from spend labels.",
  },
  {
    label: "Thin",
    detail: "Waste and energy-related rows are sparse — ask for category owners on the call.",
  },
  {
    label: "Missing",
    detail: "Use of sold products, end-of-life, franchises, investments — typical first-30-days asks.",
  },
];

const SECONDARY = [
  {
    href: "/messy-to-clean",
    title: "Scorecard",
    body: "Supplier Climate Score broken into Scope 1/2/3 availability, SBTi, and industry context — plus a secondary traceability audit.",
  },
  {
    href: "/procurement",
    title: "Buy moment",
    body: "Side-by-side vendor compare when procurement is about to place an order.",
  },
  {
    href: "/supplier-portal",
    title: "Supplier correction",
    body: "Let a supplier upload primary disclosure when the automated score is thin — queues review, does not invent a higher score.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-sm text-[var(--muted)]">
          Built for a{" "}
          <span className="font-semibold text-[var(--text)]">
            customer success / onboarding person
          </span>{" "}
          helping a new enterprise customer stand up Scope 3.
        </p>
        <h1 className="font-display max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Customer just sent a messy supplier spend file. What do we do on the first call?
        </h1>
        <p className="max-w-2xl text-lg text-[var(--muted)]">
          Open the gap checker, map the spreadsheet to GHG Protocol Scope 3 categories, see what&apos;s
          missing, and leave with a clear first-30-days data plan.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/gap-checker"
            className="inline-flex rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open the gap checker
          </Link>
          <Link
            href="/gap-checker?sample=1"
            className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Load the sample spend file →
          </Link>
        </div>
      </section>

      <section className="surface overflow-hidden" aria-labelledby="working-example">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 id="working-example" className="font-display text-xl font-semibold">
            Working example — first-call snapshot
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Same shape as the sample CSV in the gap checker: supplier, spend category, amount. On the
            call you&apos;re not calculating emissions — you&apos;re checking data readiness.
          </p>
        </div>
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-[var(--border)] p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              Messy spend extract
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                    <th className="pb-2 pr-3 font-medium">Supplier</th>
                    <th className="pb-2 pr-3 font-medium">Category</th>
                    <th className="pb-2 font-medium">Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.supplier} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3">{row.supplier}</td>
                      <td className="py-2 pr-3 text-[var(--muted)]">{row.category}</td>
                      <td className="py-2 tabular-nums">{row.spend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              What you walk away with
            </p>
            <ul className="mt-3 space-y-3">
              {FIRST_CALL_FINDINGS.map((item) => (
                <li key={item.label} className="flex gap-3 text-sm">
                  <span className="mt-0.5 shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    {item.label}
                  </span>
                  <span className="text-[var(--muted)]">{item.detail}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/gap-checker?sample=1"
              className="mt-5 inline-flex rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
            >
              Run this sample in the gap checker
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="also-useful">
        <h2 id="also-useful" className="font-display text-lg font-semibold text-[var(--muted)]">
          Also useful after kickoff
        </h2>
        <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {SECONDARY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex flex-col gap-0.5 py-3 transition sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <span className="font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                  {item.title}
                </span>
                <span className="max-w-xl text-sm text-[var(--muted)]">{item.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <details className="surface group">
        <summary className="cursor-pointer list-none px-5 py-4 font-display text-lg font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            How it&apos;s built
            <span className="text-sm font-sans font-normal text-[var(--muted)] group-open:hidden">
              API routes & data wiring
            </span>
            <span className="hidden text-sm font-sans font-normal text-[var(--muted)] group-open:inline">
              Hide
            </span>
          </span>
        </summary>
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4">
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>
              <code className="text-[var(--text)]">GET/POST /api/company-climate-profile</code> — proxies{" "}
              <code>POST /organizations</code> (+ optional GET detail); illustrative fallback if no key.
            </li>
            <li>
              <code className="text-[var(--text)]">GET /api/sbti</code> — proxies{" "}
              <code>GET /sbti_companies</code> by name / ISIN / LEI.
            </li>
            <li>
              <code className="text-[var(--text)]">POST /api/normalize-disclosure</code> — scorecard
              enrichment + secondary traceability extraction.
            </li>
            <li>
              <code className="text-[var(--text)]">POST /api/supplier-correction</code> — upload → review
              queue (score unchanged until API refresh).
            </li>
            <li>
              <code className="text-[var(--text)]">GET /api/github-feeds</code> — live GitHub raw fetch
              with local cache fallback.
            </li>
          </ul>
          <Suspense fallback={<HomeFeedsFallback />}>
            <HomeFeeds />
          </Suspense>
        </div>
      </details>
    </div>
  );
}
