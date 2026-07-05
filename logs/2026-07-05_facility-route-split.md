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

## Commit / Deployment

Pending at initial report creation.

## Remaining Actions

- Commit and push the route split.
- Confirm Vercel production deployment.
- Verify production `/facility`, `/facility/admin`, and home route behavior.
