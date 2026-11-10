# Scope Desk

Independent portfolio prototype for **Scope 3 onboarding** (customer success first), **supplier carbon footprint** visibility, and **sustainable procurement** workflows.

Built as a Next.js app, with optional **live** enrichment from free Ditch Carbon API endpoints.  
**Not affiliated with any company.** Product brand in the UI is **Scope Desk**.

## Live

| | URL |
| --- | --- |
| **GitHub** | https://github.com/adithya-nair-github/scope-desk |
| **Vercel (production)** | https://scope-desk-tau.vercel.app |

---

## Why this exists

Enterprise Scope 3 programs stall when CS / onboarding gets a messy supplier spend file and needs a first-call plan. Secondary surfaces help after kickoff:

1. **Buyers need a supplier scorecard** — Scope availability, SBTi, industry context — not a black box.
2. **Procurement decides at the point of purchase** — climate data must sit next to price.
3. **Suppliers get unfair automated scores** when public data is thin — they need a path to submit primary disclosures for review (without an instant fake score bump).

---

## Quick start

```bash
cd "C:\Users\naira\Downloads\DitchCarbon prototype"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Live API (optional but recommended)

1. Request a free API key (business email) from Ditch Carbon’s free SBTi / Company Climate Profile signup forms, e.g.  
   - https://ditchcarbon.com/resources/free-sbti-api-access  
   - https://ditchcarbon.com/resources/company-climate-profile-api  
2. Copy `.env.example` → `.env.local` and set:

```env
DITCHCARBON_API_KEY=your_token_here
```

3. Restart `npm run dev`.

The Bearer token is used **only in Route Handlers** (`app/lib/ditchcarbon-client.ts`). It is never sent to the browser.

Without a key, every live panel degrades to **clearly labeled illustrative** data.

---

## Product surfaces

| Route | What it shows | Live data |
| --- | --- | --- |
| `/gap-checker` | **Hero:** CSV → Scope 3 mapping, **spend-weighted** data readiness, gap $ impact, Markdown 30-day plan | None (fully client-side) |
| `/messy-to-clean` | **Scorecard:** Supplier Climate Score components (Scope 1/2/3, SBTi, industry avg) + secondary Traceability audit | SBTi + climate profile enrichment |
| `/procurement` | Buy moment: two vendors, price + Supplier Climate Score + Reduction Co-Pilot | `/api/company-climate-profile` |
| `/supplier-portal` | Supplier uploads primary report → **under review / recalculating** (score unchanged until API refresh) | Baseline from climate profile API |

Local-only folders (`_carbon-trail-ref/`, `static-gap-checker/`) are gitignored reference/legacy material — not part of the shipped product.

---

## API routes (this app)

| Route | Upstream / behavior |
| --- | --- |
| `GET/POST /api/company-climate-profile` | Proxies `POST https://api.ditchcarbon.com/organizations` (+ optional `GET /organizations/{id}`). Fallback illustrative profile. |
| `GET /api/sbti` | Proxies `GET https://api.ditchcarbon.com/sbti_companies?company_name=&isin=&lei=` |
| `POST /api/normalize-disclosure` | Local extraction + live enrichment for Scorecard / Traceability |
| `POST /api/supplier-correction` | Extract upload + baseline score + review queue (no score boost) |
| `GET /api/github-feeds` | Live GitHub raw fetch with local cache fallback |
| `GET /api/demo-suppliers` | Prefill ~10 demo suppliers |

Official docs: https://docs.ditchcarbon.com/ · Auth: `Authorization: Bearer <key>`

---

## Deploy (Vercel)

Repo is already on GitHub: https://github.com/adithya-nair-github/scope-desk

**First production deploy does not require `DITCHCARBON_API_KEY`.** Without it, live panels use clearly labeled illustrative fallbacks.

### CLI (recommended)

```bash
cd "C:\Users\naira\Downloads\DitchCarbon prototype"
npx vercel login
npx vercel --prod --yes
```

Project is linked to GitHub (`adithya-nair-github/scope-desk`) and live at https://scope-desk-tau.vercel.app.

### Optional: live API later

In [Vercel → Project → Settings → Environment Variables](https://vercel.com/dashboard), add:

| Name | Value | Environments |
| --- | --- | --- |
| `DITCHCARBON_API_KEY` | your free Ditch Carbon token | Production (and Preview if you want) |

Redeploy after saving. Request a key from Ditch Carbon’s free SBTi / Company Climate Profile signup forms.

### Dashboard alternative

1. Import `adithya-nair-github/scope-desk` in Vercel → Framework: Next.js → Root Directory: `.`
2. Deploy without env vars first.
3. Add `DITCHCARBON_API_KEY` later if desired.

---

## Attribution & honesty

- Product brand in the UI is **Scope Desk**, not Ditch Carbon.
- Scores are labeled **Supplier Climate Score** / **Carbon Risk Score**.
- Sample disclosure text is **illustrative** (H&M Group–style / Arvind–style phrasing for demos).
- When live API data is shown, the UI marks **Live data**; otherwise **Illustrative**.
- Independent prototype by Adithya Nair. Not affiliated with any company.
