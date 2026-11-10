# Scope Desk — Product / UX signoff brief for Gemini

**From:** Adithya Nair  
**To:** Gemini (final product & UX critique before go-live / sharing)  
**App name:** Scope Desk  
**Header lockup:** Ditch Carbon × Adithya  
**Local URL:** http://localhost:3000  
**Project path:** `C:\Users\naira\Downloads\DitchCarbon prototype`  
**Status:** Independent portfolio prototype (not an official Ditch Carbon product)  
**Must-fix pass:** See `CHANGELOG-GEMINI-FIXES.md` (Scorecard pivot, no upload score boost, spend-weighted gap checker, Markdown 30-day export, gitignore for `_carbon-trail-ref/` / `static-gap-checker/`).

Please critique this as a hiring-manager / CS-ops reviewer would. Be blunt about what lands, what feels fake, and what to fix before I send the link to Ditch Carbon.

---

## 1. Purpose & audience

**Why this was built**

I am adapting patterns from a prior ESG extraction prototype (“Carbon Trail”) into a new Next.js app aimed at **Ditch Carbon**. The goal is to show I understand their space (Scope 3 / supplier climate data / procurement embed) and that I can ship a usable CS-facing workflow—not just a generic ESG dashboard.

**Audience for the demo**

- Primary reviewer: Ditch Carbon team (product / CS / ops interest)
- Persona on the page: a **customer success / onboarding** person helping a new enterprise customer stand up Scope 3 after they dump a messy supplier spend file
- Secondary surfaces speak to procurement buyers and suppliers (supplier scorecard / traceability, point-of-purchase climate scores, supplier self-correction under review)

**What success looks like for me**

Someone at Ditch Carbon opens the link, immediately understands *who it’s for* and *what moment it solves*, tries the gap checker with sample data in under a minute, and comes away thinking: “this person gets our customer reality and can build product.”

---

## 2. What Ditch Carbon does (context)

Ditch Carbon is a **Scope 3 / supplier emissions platform** for large organisations. They maintain climate data for a very large organisation set (public materials cite on the order of **2M+ organisations**), combining disclosed primary emissions where available with calculated estimates when not, plus commitments (e.g. SBTi) and quality/provenance signals. Buyers and platforms consume that via their product, CSV/warehouse shares, and REST APIs—including a free **Company Climate Profile** / **SBTi** API path (Bearer token) that returns organisation match, a climate score, ranks/percentiles, and commitment flags. Full emissions detail is a separate commercial API layer. This prototype optionally calls those free endpoints server-side; it does **not** claim to be their product.

---

## 3. Product thesis of THIS prototype

Enterprise Scope 3 programs stall on three operational problems:

1. **Buyers don’t trust black-box scores** — they need a scorecard (Scope availability, SBTi, industry context) with optional traceability citations.
2. **Procurement decides at the point of purchase** — climate data has to sit next to price, not in a quarterly PDF.
3. **Suppliers get unfair automated scores** when public data is thin — they need a path to submit primary disclosures for review (without an instant fake score bump).

**Scope Desk** ships those three surfaces, plus a **hero CS onboarding gap checker**: turn a messy spend CSV into GHG Protocol Scope 3 **spend-weighted data-readiness** (mapping, uncovered $, quality flags, Markdown 30-day plan)—explicitly **not** a tonnes CO₂e calculator.

Framing on the landing page: *“Customer just sent a messy supplier spend file. What do we do on the first call?”*

---

## 4. What’s in the build (as of now)

### Shell / chrome

- **Brand:** “Scope Desk” (display name) with subtitle **“Ditch Carbon × Adithya · Scope 3 onboarding for customer success”**
- **Nav:** Home · **Gap checker** (primary accent CTA) · Scorecard · Buy moment · Supplier portal
- **Theme:** light/dark toggle (`localStorage` key `scope-desk-theme`); CSS variables; soft green accent on cool paper/green backgrounds
- **Typography:** Fraunces (display) + Source Sans 3 (body) via `next/font`
- **Metadata title:** “Scope Desk — Scope 3 onboarding for customer success”
- **No global disclaimer footer** (removed intentionally—see Branding)

### `/` — Landing (CS first-call framing)

- Opens on **one moment**, not a four-card feature menu
- Audience line first: built for a CS / onboarding person standing up Scope 3
- Headline + short support + CTAs: **Open the gap checker** / **Load the sample spend file**
- **Working example** section: mini messy spend table (5 rows) + “What you walk away with” (Mapped / Thin / Missing)
- **Also useful after kickoff** — secondary links only:
  - Scorecard → `/messy-to-clean`
  - Buy moment → `/procurement`
  - Supplier correction → `/supplier-portal`
- Collapsed **How it’s built** `<details>`: lists API routes + live GitHub feed status chips + whether `DITCHCARBON_API_KEY` is configured

### `/gap-checker` — Hero CS tool

Fully **client-side**. CSV never uploads to a server.

| Capability | Behavior |
| --- | --- |
| Input | Choose CSV **or** “Use sample data”; `?sample=1` auto-loads sample from homepage CTA |
| Sample | Bundled fictional CSV (`app/lib/sample-spend.ts`) — ~25 rows, labeled “Illustrative sample data” |
| Mapping | Keyword rules map spend category/supplier → one of **15 GHG Protocol Scope 3 categories** (+ Unmapped); each row has an editable dropdown |
| Readiness score | **Spend-weighted** % of dollars under coverage (Partial = half credit; unmapped = uncovered). Category completeness shown as secondary. Data-readiness only — not CO₂e |
| Spend KPIs | **Spend under coverage**, **Uncovered spend $**, unmapped spend |
| Gap report | Per-category status, rows, spend $, share, High/Med/Low impact, covered $ — sorted by spend |
| Quality flags | Missing spend, missing country, unrecognised/unmapped category, duplicate supplier—each with a suggested fix + spend impact |
| First 30 days plan | Week 1–4 narrative + Jira/Asana-style task table (supplier, category, spend impact, owner, concrete task) |
| Export | **Copy Markdown** → structured Markdown task table to clipboard |
| Privacy | Inline: “CSV stays in your browser.” |

### `/messy-to-clean` — Scorecard (+ Traceability audit)

- Hero: **Supplier Climate Scorecard** for CS/procurement — Scope 1/2/3 availability, SBTi commitment, industry average comparison
- Secondary collapsible **Traceability audit**: source disclosure + normalized fields with citations (compliance, not the page hero)
- Samples: H&M Group–style, Arvind Ltd–style, Sparse SME (all **illustrative**, with disclaimers in sample payload)
- Enrichment via `/api/normalize-disclosure` (live if key present; otherwise illustrative, with StatusBanner)

### `/procurement` — Buy moment (Ariba-style POS mock)

- Chrome labeled “Sourcing workspace · RFQ-2048 · Ocean freight lane” (explicitly a **workflow mock**, not affiliated with any vendor platform)
- Side-by-side **Vendor A / Vendor B** from `/api/demo-suppliers` (~10 prefills; default Maersk vs DHL)
- Unit price + lead time beside **Supplier Climate Score** ring
- Live profiles via `POST /api/company-climate-profile` when key set; else illustrative fallback + banner
- “Greener choice” highlight on higher score
- **Reduction Co-Pilot**: heuristic tips (score lead, SBTi signal, price-within-12%, dual-award scenario, next ask from targets)

### `/supplier-portal` — Supplier self-correction

- Supplier picks their record, uploads/pastes primary report text (txt/csv/md mock—not real PDF parsing)
- Default illustrative Northwind Packaging GHG inventory text
- `POST /api/supplier-correction` → extract fields + **Primary data under review / Recalculating via API** (request ID + timestamp)
- Baseline score **unchanged** on upload; no `applyPrimaryUploadBoost` / instant greenwash delta

### Sibling / reference (local only — gitignored)

- `static-gap-checker/` and `_carbon-trail-ref/` may exist locally for reference; they are in `.gitignore` and are **not** the shipped product

### API routes

| Route | What it does | Live vs illustrative |
| --- | --- | --- |
| `GET/POST /api/company-climate-profile` | Proxies `POST https://api.ditchcarbon.com/organizations` (+ optional `GET /organizations/{id}`); normalizes score 0–1 → 0–100 display | Live if key OK; else labeled illustrative profile |
| `GET /api/sbti` | Proxies `GET /sbti_companies?company_name=&isin=&lei=` | Live rows if available; else illustrative SBTi-shaped row |
| `POST /api/normalize-disclosure` | Local regex/evidence extraction + parallel SBTi + climate profile enrichment | Extraction always local; enrichment live/illustrative |
| `POST /api/supplier-correction` | Extract upload + baseline score + review queue | Baseline live/illustrative; score stays put until API refresh |
| `GET /api/github-feeds` | Carbon Trail–style live GitHub raw fetch with local cache fallback | `live` / `fallback` / `error` per feed |
| `GET /api/demo-suppliers` | Prefill ~10 demo suppliers + `keyConfigured` flag | Local list always |

**Auth model:** `DITCHCARBON_API_KEY` is read only in server Route Handlers (`app/lib/ditchcarbon-client.ts`). Never sent to the browser. UI uses **Live data** / **Illustrative** / **API unavailable** chips via `StatusBanner`.

---

## 5. Data story

### Sample spend CSV (gap checker)

Bundled in `app/lib/sample-spend.ts`. Columns: `supplier, category, spend, country`. Fictional vendors only (Northwind Packaging, Helios Cloud, Riverbend Freight, etc.). Intentionally includes quality issues for flags: missing spend, missing country, duplicate supplier (“Duplicate Co”), “misc other” unmapped bucket, high-spend capital goods, etc.

### Sample disclosures (Scorecard / Traceability)

Illustrative H&M Group–style / Arvind–style / sparse SME prose in `app/lib/sample-disclosures.ts`. Numbers are fabricated for demos; disclaimers travel with the sample response.

### Demo suppliers

~10 names in `app/lib/demo-suppliers.ts`: H&M Group, Arvind Ltd, Unilever, Nestlé, Apple, Microsoft, Maersk, DHL, Northwind Packaging Co, Riverbend Freight Ltd—with illustrative unit prices, lead times, and fallback scores.

### GitHub feeds

`loadGithubFeeds()`:

1. **Quantified fashion catalog** — tries live `raw.githubusercontent.com` README; falls back to `app/lib/github-cache/quantified-fashion-note.json`
2. **GHG Protocol scope map** — local cache only (`ghg-scope-map.json`)

Surfaced on the homepage “How it’s built” panel and via `GET /api/github-feeds`.

### Ditch Carbon free API key path

1. Request free key (business email) from e.g.  
   - https://ditchcarbon.com/resources/free-sbti-api-access  
   - https://ditchcarbon.com/resources/company-climate-profile-api  
2. Copy `.env.example` → `.env.local`  
3. Set `DITCHCARBON_API_KEY=…` (optional `DITCHCARBON_API_BASE`)  
4. Restart `npm run dev`  

Without a key, Scorecard / Buy moment / Supplier portal degrade to clearly labeled illustrative data. **Gap checker runs fully either way** (no API dependency).

Official docs referenced in README: https://docs.ditchcarbon.com/

---

## 6. Tech stack & how to run / deploy

**Stack**

- Next.js **15.5.x** (App Router)
- React **19.1** / React DOM
- TypeScript **5.9**
- Tailwind CSS **4.1** (`@tailwindcss/postcss`)
- `lucide-react` present as a dependency (not central to the product story)
- Package name: `scope-desk` `0.1.0` private

**Run locally**

```bash
cd "C:\Users\naira\Downloads\DitchCarbon prototype"
npm install
npm run dev
```

Open http://localhost:3000

Scripts: `dev` / `build` / `start`

**Deploy (from README)**

1. Push folder to a Git repo  
2. Import in **Vercel** → Framework: Next.js  
3. Add env var `DITCHCARBON_API_KEY` in Vercel project settings  
4. Deploy  

---

## 7. Branding choices (what’s intentional / what was removed)

**Kept / added**

- Product brand in UI: **Scope Desk** (not “Ditch Carbon” as product name)
- Collab-style header line: **Ditch Carbon × Adithya** (inspired by Carbon Trail “× Adithya” collab lockup)
- Score naming: **Supplier Climate Score** / carbon risk–style 0–100 display (API 0–1 scaled when live)
- Live vs Illustrative labeling on enrichment surfaces
- Soft green operational aesthetic (not purple SaaS / cream-serif cliché)

**Removed (by design, recent pass)**

- Global footer stacks that led with “Demo honesty…”, “Independent prototype by Adithya Nair. Not affiliated…”, and “Illustrative demo data when APIs aren’t configured…”
- Landing that opened as a generic four-demo menu / “not another ESG dashboard” anti-headline
- Putting “No API key” badges as the first thing a reviewer sees on the homepage hero

**Honesty still present, but quieter**

- Gap checker: “CSV stays in your browser” + illustrative chip on sample load
- Feature pages: StatusBanner for live/illustrative
- Sample disclosure disclaimers inside Scorecard / Traceability flows
- README documents affiliation honesty for engineers; the live UI has no site-wide affiliation footer

---

## 8. Known limitations / honesty checklist

Call these out before sharing externally:

1. **Not an official Ditch Carbon product.** Portfolio prototype by Adithya to demonstrate CS/product thinking and engineering.
2. **No API key ⇒ illustrative scores/SBTi** on Scorecard, Procurement, Supplier portal. Gap checker is unaffected.
3. **Gap checker is spend-weighted data-readiness, not emissions calculation.** No tonnes CO₂e, no spend×EF engine.
4. **Disclosure “extraction” is local regex/keyword mining**, not LLM and not Ditch Carbon’s production pipeline. Traceability citations only exist for matched patterns.
5. **Supplier portal does not invent a higher score on upload** — it queues review; a real recomputed score would come from the climate-profile API later.
6. **Procurement UI is a mock** (Ariba-like chrome for narrative). Not integrated with SAP/Ariba.
7. **Sample company narratives are fabricated** (H&M/Arvind-*style*). Do not present as real filings.
8. **PDF upload is text-file mock** (`.txt` / `.csv` / `.md`); no PDF text extraction.
9. **GitHub feeds are thin** (one remote README + local GHG map cache)—pattern demo more than a data product.
10. **No auth, no multi-tenant persistence, no production logging/analytics** beyond Next.js defaults.

---

## 9. Explicit ask for Gemini

Please review as if you are helping me decide whether this is ready to share with Ditch Carbon. Critique along these axes:

### A. Hiring-manager impact
- Within 5–10 seconds on `/`, is it obvious who this is for and why I built it?
- Does the CS first-call story feel sharper than a generic ESG portfolio piece?
- What would make a founder / CS lead want a conversation after 2 minutes of clicking?

### B. CS authenticity
- Does the gap checker workflow match how a real CS/onboarding person would run a first call (file → map → gaps → flags → 30-day plan → copy out)?
- What’s missing or over-simplified that would break credibility with someone who has onboarded Scope 3 customers?
- Is the 30-day plan useful or template-generic?

### C. Go-live readiness (demo quality)
- Is the information hierarchy correct (gap checker hero; other three secondary)?
- Are Live/Illustrative labels honest enough without apologizing the whole product into “fake”?
- Any UX bugs, dead ends, or confusing labels before I deploy to Vercel?
- Should the affiliation disclaimer return in a subtler form (e.g. one footer line) now that the collab header says “Ditch Carbon × Adithya”?

### D. What to fix before sharing with Ditch Carbon
Please return a **prioritized punch list**:
1. Must-fix before sending the link  
2. Should-fix if I have a few hours  
3. Nice-to-have later  

Also flag anything that could look like I’m claiming to be their product, misusing their brand, or misrepresenting live API capabilities.

---

## Quick demo script (for reviewers)

1. Open http://localhost:3000 — read the CS first-call framing.  
2. Click **Load the sample spend file** → land in gap checker with sample loaded.  
3. Skim mapping table, **spend under coverage / uncovered $**, readiness %, gap report, quality flags, **Copy Markdown** 30-day plan.  
4. Optional: Scorecard → Load H&M sample; note components + open Traceability audit; Live vs Illustrative.  
5. Optional: Buy moment → Maersk vs DHL; skim Co-Pilot.  
6. Optional: Supplier portal → submit default Northwind text; confirm score unchanged + “under review” / request ID.

---

*End of brief. Source of truth: current codebase under `C:\Users\naira\Downloads\DitchCarbon prototype` (README + `app/` routes/libs), not earlier planning prompts.*
