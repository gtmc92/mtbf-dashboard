# 2026-07-06 Repair Type Rename Final Report

## Result
- COMPLETE

## Diagnosis
- `일반제작` existed in fallback management mapping, upload transformation output, facility summary TOP filters, chart colors/legend ordering, Non-Repair UI copy, DATA_TYPE master CSV, bundled DATA_BASE seed rows, raw upload sample CSV, and existing production database rows.
- Migrated official type label to `제작설치`; kept `일반제작` only as a legacy upload alias in code and as migration match criteria.

## Files Modified
- `src/lib/repairTypes.ts`
- `src/lib/dataUpload/managementType.ts`
- `src/lib/dataUpload/transform.ts`
- `src/app/api/facility/summary/route.ts`
- `src/app/api/data/template/raw/route.ts`
- `src/components/facility/MaintenanceAnalysisView.tsx`
- `src/components/facility/ProcessStackedChart.tsx`
- `src/components/facility/RepairTypePieChart.tsx`
- `prisma/DATA_TYPE.csv`
- `prisma/DATA_BASE.csv`
- `prisma/seed-data/sample-raw-upload.csv`
- `prisma/migrations/20260706083700_rename_general_fabrication_to_fabrication_install/migration.sql`

## DB Update
- Method: Prisma migration `20260706083700_rename_general_fabrication_to_fabrication_install` applied with `prisma migrate deploy`.
- Records updated in place; no `RepairTypeRecord` rows were deleted.
- Verification query after migration:
  - old `RepairTypeRecord.repairType` or `repairItem` = `일반제작`: 0
  - `RepairTypeRecord.repairType` = `제작설치` and `managementType` = `Non-Repair`: 632
  - old `RepairTypeMaster.repairType` = `일반제작`: 0
  - `RepairTypeMaster.repairType` = `제작설치`: `Non-Repair`, display order 5
  - old upload staging JSON repair type/item = `일반제작`: 0

## Upload Validation
- `제작설치`: transform check produced `repairType: 제작설치`, `managementType: Non-Repair`, no errors.
- `일반제작` alias: transform check normalized to `repairType: 제작설치`, `managementType: Non-Repair`, no errors.

## UI / API Verification
- `/facility`: local and production routes returned HTTP 200.
- `/facility/admin`: local dev request timed out while data-backed requests were hanging; database and production deployment checks succeeded.
- Production `/api/facility/summary`: HTTP 200; contains `제작설치`, does not contain `일반제작`; `byRepairType` includes `제작설치` with count 579 and duration 178890; improvement TOP items contain `제작설치` and do not contain `일반제작`.
- Production raw upload template: HTTP 200; contains `제작설치`, does not contain `일반제작`.
- Browser automation: unavailable in this session because the required Node REPL browser tool was not exposed. Used HTTP/API verification instead.

## Validation
- `rg -n "일반제작" -S src prisma public --glob '!prisma/migrations/20260706083700_rename_general_fabrication_to_fabrication_install/migration.sql'`: only intentional legacy alias constant remained.
- `npm run build`: passed with Next.js 16.2.1 and Prisma Client generation.
- Production deployment inspect: Ready.

## Commit / Deployment
- Implementation commit: `f5b11b3` (`Rename fabrication repair type`)
- Push: `origin/main` updated successfully.
- Production deployment: `dpl_2F3js19azSqFdUGDx7XQXuSHjNGr`
- Production URL: `https://mtbf-dashboard.vercel.app`
- Deployment URL: `https://mtbf-dashboard-et5ffiz4l-gtmc92s-projects.vercel.app`
- Deployment status: Ready

## Remaining Issues
- None for the requested rename.
- Unrelated pre-existing local worktree changes remain unstaged: `.claude/settings.local.json`, `.playwright-mcp/`, and image files in the repo root.
