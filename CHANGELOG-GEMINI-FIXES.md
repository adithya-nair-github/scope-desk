# Gemini go-live must-fixes (Scope Desk)

Short note of what changed for Gemini’s sign-off feedback.

## 1. Evidence → Scorecard / Traceability (`/messy-to-clean`)

- Nav + landing secondary link: **Scorecard** (was Evidence).
- Page hero is a **Supplier Climate Scorecard**: Scope 1/2/3 availability, SBTi commitment, industry average comparison.
- Raw disclosure / citation view is a secondary collapsible **Traceability audit** for compliance — not the page hero.
- Copy aimed at CS / procurement, not internal data engineering.

## 2. Kill artificial score boost (`/supplier-portal`)

- Removed `applyPrimaryUploadBoost`.
- Upload returns **Primary data under review** / **Recalculating via API** with request ID + timestamp.
- Published score stays at baseline until a real API refresh; no instant greenwash delta.

## 3. Gap checker weighs by spend (`/gap-checker`)

- Primary readiness is **spend-weighted** (category completeness shown as secondary).
- Prominent **Spend under coverage** and **Uncovered spend $**.
- Gap report sorted by spend with High/Med/Low impact and covered $.
- Explicit: data-readiness, not CO₂e.

## 4. 30-day plan export

- **Copy Markdown** exports a Jira/Asana-style task table: ID, week, supplier, category, spend impact, owner, concrete task wording.
- On-page task board mirrors that structure.

## 5. Carbon Trail / legacy refs

- `_carbon-trail-ref/` and `static-gap-checker/` added to `.gitignore` (kept locally; not for shared repo ship).
- README no longer points people at those folders as the product.
