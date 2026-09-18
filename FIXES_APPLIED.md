# Auricity v10 — Audit Fix Pack

Based on `Auricity_Website_Full_Functionality_Report.pdf` dated 14 Sep 2026.

## Fixed
- Canonical `/contact` navigation preserved across header, mobile menu and footer.
- Inventory counts are now derived from actual public inventory instead of hard-coded 320+/180+/65+/90+/45+/450+ claims.
- Legacy `Buy`/`Rent` listing values are normalized to the public filter model (`sale`/`rent`/`pg`/`commercial`/`plots`).
- Seed inventory now includes the existing legacy rental seed instead of dropping it during initialization.
- Property search now matches address, society/landmark text and tags, not only title/locality/description.
- Property-type filtering handles legacy values such as `Apartment`, `Independent House / Villa`, `row_house`, etc.
- Commercial and plot category navigation now lands on their correct filtered views.
- AI Valuator frontend endpoint/schema now matches the backend valuation endpoint and response fields; multilingual language is forwarded.
- AI Valuator avoids repeating an identical request and falls back safely when Gemini is unavailable.
- Contact form no longer shows a false success state when the server submission fails.
- Mobile direct-conversion actions now include Call + WhatsApp and are positioned above the mobile navigation bar.
- Page lazy-loading fallback replaced with a skeleton loading state.
- Property detail media no longer fabricates 20+ unrelated gallery images, fake YouTube tours, or random RERA numbers. Missing floor plans/videos are shown as unavailable instead.
- New project CMS entries no longer generate fabricated RERA registration numbers.
- EMI utility now handles a 0% interest rate correctly.
- Current authenticated user session persists locally instead of silently starting as a seeded demo user.
- Added `scripts/audit-site.mjs` for repeatable static regression checks.

## Verification
- Static audit: all checks passed.
- TypeScript/TSX syntax transpile check: 103/103 files passed.
- Full `npm run build` was not executable in this sandbox because the npm registry/dependency cache was unavailable; no source dependency was intentionally changed to hide that limitation.

## Remaining production dependency
The source already reports that file-based server persistence is not durable on Vercel. A real external persistence layer (for example Supabase/Postgres/KV) still requires project credentials/configuration before CMS changes can be guaranteed across Vercel serverless container restarts.


## V11 — Compact Footer
- Reduced footer vertical footprint substantially.
- Removed the large inline inquiry form from the global footer; Contact Us remains available through Quick Links and the dedicated Contact page.
- Kept company address, CIN, PAN, MahaRERA, phone, email, social links, partner/security badges, disclaimer and copyright.
- Preserved Contact Us normalization to the `contact` view.
- Converted footer spacing, badges and utility controls to a compact responsive layout for mobile and desktop.


## v12 — Compact Homepage Wireframe Update
- Homepage density and vertical rhythm reduced to match supplied PDF.
- Four quick-action cards restored.
- Redundant standalone homepage rows removed from public flow.
- Footer spacing tightened.
