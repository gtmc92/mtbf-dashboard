# Facility Route Split Final Report

Date: 2026-07-05

## Scope

Split the maintenance analysis workflow into two routes:

- `/facility`: analysis dashboard only.
- `/facility/admin`: analysis dashboard plus raw upload/admin workflow.

The existing `/input` raw upload workflow remains unchanged.

## Changes

- Moved the existing maintenance analysis page logic into `MaintenanceAnalysisView`.
- Replaced `/facility/page.tsx` with a thin route wrapper that renders analysis only.
- Added `/facility/admin/page.tsx` with the Admin title and raw upload panel inserted after filters.
- Kept the home card link pointing to `/facility`.
- Did not change MTBF/MTTR calculations, upload APIs, or Prisma schema.

## Files

- `src/components/facility/MaintenanceAnalysisView.tsx`
- `src/app/facility/page.tsx`
- `src/app/facility/admin/page.tsx`
- `logs/2026-07-05_facility-route-split.md`

## Validation

### Static Inspection

- `RawUploadPanel` is imported by:
  - `src/app/facility/admin/page.tsx`
  - `src/app/input/page.tsx`
- `RawUploadPanel` is no longer imported by `src/app/facility/page.tsx`.
- Home menu still links `유지보수 분석` to `/facility`.

### Build

Command:

```text
cmd /c npm.cmd run build
```

Result: PASS

Evidence:

- Next.js 16.2.1 compiled successfully.
- TypeScript completed successfully.
- Generated routes include:
  - `/facility`
  - `/facility/admin`

### Local Browser Check

Attempted local production browser verification after `next start`.

Result: PARTIAL

Evidence:

- `3002` was unavailable due to `EADDRINUSE`.
- `3003` and `3004` responded with HTTP 200 during immediate checks.
- The local background server process did not remain alive long enough for Playwright route verification.

Production route verification is required after deployment.

### Final Production Browser Check

Base URL:

```text
https://mtbf-dashboard.vercel.app
```

Tool: Playwright with system Chrome.

`/facility` result:

```json
{
  "title": "유지보수 분석",
  "hasLoading": false,
  "hasUploadHeading": false,
  "hasTemplateDownload": false,
  "fileInputs": 0,
  "hasPreviewButton": false,
  "hasHistory": false,
  "hasRevert": false,
  "hasNonRepair": true,
  "hasWorkTimeChart": true,
  "hasPvrChart": true,
  "hasTop10": true
}
```

`/facility/admin` result:

```json
{
  "title": "유지보수 분석 · Admin",
  "hasLoading": false,
  "hasUploadHeading": true,
  "hasTemplateDownload": true,
  "fileInputs": 1,
  "hasPreviewButton": true,
  "hasHistory": true,
  "hasRevert": true,
  "hasNonRepair": true,
  "hasWorkTimeChart": true,
  "hasPvrChart": true,
  "hasTop10": true
}
```

Home route result:

```json
{
  "homeHref": "/facility"
}
```

## Commit / Deployment

- Implementation commit: `34d95da`
- Implementation message: `Split maintenance analysis admin route`
- Report update commit: `3b3cc3f`
- Report update message: `Update facility route split report`
- Push status:
  - `843d26b..34d95da main -> main`
  - `34d95da..3b3cc3f main -> main`
- Implementation Vercel deployment: `dpl_BfKFdsBNUiU7AgcWcXHGFdiVPAuv`
- Implementation deployment URL: `https://mtbf-dashboard-mn4eissgf-gtmc92s-projects.vercel.app`
- Final latest Vercel deployment after report update: `dpl_6AuwSwpfwbb5LpN8qU9zFseGWoS8`
- Final latest deployment URL: `https://mtbf-dashboard-kss9iluog-gtmc92s-projects.vercel.app`
- Production alias: `https://mtbf-dashboard.vercel.app`
- Status: Ready
- Build log evidence:
  - `Cloning github.com/gtmc92/mtbf-dashboard (Branch: main, Commit: 34d95da)`
  - `Cloning github.com/gtmc92/mtbf-dashboard (Branch: main, Commit: 3b3cc3f)`
- Final deployment routes generated:
  - `/facility`
  - `/facility/admin`

## Final Result

Complete. The public maintenance analysis route is now analysis-only, and the direct admin route contains the upload workflow plus the same analysis dashboard. The final production alias was verified after the latest report-update deployment.

## Remaining Actions

None.
