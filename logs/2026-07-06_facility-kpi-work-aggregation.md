# 2026-07-06 Facility KPI and Work Aggregation

## Summary

- Updated `/facility` KPI hierarchy to show facility-team total work count and total work time across Preventive, Reactive, and Non-Repair work.
- Added a consistent work-type status area for Preventive, Reactive, and Non-Repair counts and ratios.
- Reworked the Non-Repair section to show Non-Repair count/ratio plus 제작설치, 개발작업, and 유지보수 counts.
- Changed TOP10 aggregation to group the same work by 작업일, 대표설비, 수리유형, and 사고 처리 내용, excluding 조치자.
- Added same-year cumulative MTBF/MTTR comparison against the previous year's same cumulative month range.

## KPI Changes

- `총 사고·수리 건수` -> `시설팀 총 작업건수`
- `총 수리 시간` -> `시설팀 총 작업시간`
- `비수리 작업 비율` -> `Non-Repair 작업`
- Added `작업유형 현황`: Preventive, Reactive, Non-Repair.
- Added `MTBF / MTTR 동년 누적 비교`.

## SQL / Prisma Aggregation Logic

- Kept the existing `RepairTypeRecord` source and Prisma schema unchanged.
- Facility totals still aggregate `_sum.count` and `_sum.durationMin` from `repairTypeRecord`.
- Management-type stats still group by `managementType`.
- Repair-type stats still group by `repairType`, with legacy `일반제작` normalized to `제작설치`.
- Added `monthlyRecord.aggregate` for current and previous year cumulative MTBF/MTTR comparison, scoped to F2 processes.

## TOP10 Grouping

Grouping key:

```text
년도 + 월 + 일 + 대표설비 + 수리유형 + 사고 처리 내용
```

- 조치자 is intentionally excluded.
- Group count is displayed as one work item.
- `durationMin` is summed as total work time.
- `technicianCount` is summed as total assigned personnel.
- Applied to 정지수리 TOP10, 제작설치 TOP10, 개발작업 TOP10, and 유지보수 TOP10.

## MTBF / MTTR Comparison Formula

- Current period: selected year January through selected month.
- If no month is selected, uses the latest facility work month for the selected year.
- Previous period: previous year January through the same end month.
- MTBF: `sum(operatingTime) / sum(stopCount) / 60`
- MTTR: `sum(stopTime) / sum(stopCount) / 60`
- Percentage change: `(current - previous) / previous * 100`
- Existing MTBF/MTTR formulas were not changed.

## Validation

- `npm run build`: passed.
- `npx eslint src/app/api/facility/summary/route.ts src/components/facility/MaintenanceAnalysisView.tsx`: passed.
- `npm run lint`: failed due to pre-existing unrelated lint errors in `src/app/compare/page.tsx`, `src/app/input/page.tsx`, `src/app/page.tsx`, `src/app/status/page.tsx`, `src/components/facility/RepairTypePieChart.tsx`, `src/components/home/OnboardingModal.tsx`, and warnings in `src/app/api/factories/route.ts`.
- Production-mode local server check with network access:
  - `/facility`: HTTP 200.
  - `/api/facility/summary?year=2026&month=3`: totalCount 289, Preventive 156, Non-Repair 115, Reactive 18, MTBF 130.7h vs 202.9h, MTTR 0.82h vs 0.97h.
  - `/api/facility/summary?year=2026`: totalCount 1628, cumulative comparison end month 6.
- Direct Prisma duplicate-work check found grouped 제작설치 work with summed duration/personnel, e.g. 1360 minutes and 2 personnel for a duplicated 2026 F2_텐타 2호기 work item.

## Playwright / Browser Verification

- Browser skill instructions were loaded.
- The required Node REPL browser execution tool was not exposed in this session, so Playwright MCP browser automation could not be run.
- API and production-mode HTTP verification were used as the available substitute.

## Commit / Push / Deployment

- Commit: `6b27557` (`Improve maintenance analysis KPI and work aggregation`).
- Push: pending.
- Vercel deployment: pending.
- Production URL verification: pending.

## Remaining Actions

- Commit and push this change.
- Verify the Vercel production deployment after push.
