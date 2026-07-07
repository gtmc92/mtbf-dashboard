# Final Report — MTBF-FACILITY-CUMULATIVE-TOP10-COMMIT-DEPLOY-VERIFY-001

## 1. Result
PASS

작업일: 2026-07-07

## 2. Commit / Push
- 구현 커밋: `090ef64` (`feat(facility): aggregate top work by location and content`)
- Push: `origin/main` 완료
- 배포 검증 보고서: 별도 커밋으로 저장

## 3. Deployment
- Vercel deployment URL: `https://mtbf-dashboard-iawts2qdc-gtmc92s-projects.vercel.app`
- Production alias: `https://mtbf-dashboard.vercel.app`
- Vercel deployment id: `dpl_3kvFgwLdqU428BpbQMWBe6bdSVgn`
- 상태: Ready
- Target: production
- Duration: 40s

## 4. 변경 파일
구현 커밋 `090ef64` 포함 파일:
- `src/app/api/facility/summary/route.ts`
- `src/components/facility/MaintenanceAnalysisView.tsx`
- `src/app/input/page.tsx`
- `logs/2026-07-07_facility-cumulative-top10-by-location-content.md`

커밋 제외 확인:
- `.claude/settings.local.json`
- `.playwright-mcp/`
- repo root image files

## 5. 검증 결과
- `npx eslint src/app/api/facility/summary/route.ts src/components/facility/MaintenanceAnalysisView.tsx src/app/input/page.tsx`: PASS
- `npm run build`: PASS
  - Prisma Client 생성 성공
  - Next.js 16.2.1 production build 성공
  - route 목록에 `/input`, `/facility`, `/facility/admin`, `/api/facility/summary` 포함
- 직접 API 핸들러 검증:
  - `/api/facility/summary?year=2026&month=3`: status 200, TOP10 신규 필드 포함
  - `/api/facility/summary?year=2026`: status 200, TOP10 신규 필드 포함

## 6. Production 검증
Production alias HTTP 확인:
- `https://mtbf-dashboard.vercel.app/input`: 200, `text/html`
- `https://mtbf-dashboard.vercel.app/facility`: 200, `text/html`
- `https://mtbf-dashboard.vercel.app/facility/admin`: 200, `text/html`
- `https://mtbf-dashboard.vercel.app/api/facility/summary?year=2026&month=3`: 200, `application/json`
- `https://mtbf-dashboard.vercel.app/api/facility/summary?year=2026`: 200, `application/json`

Production API 확인:
- `year=2026&month=3`
  - `topRepairs.length`: 7
  - `subEquipment`, `repairItem`, `normalizedDescription`, `occurrenceCount`, `firstDate`, `lastDate`, `dates`, `workerNames` 포함 확인
- `year=2026`
  - `topRepairs.length`: 10
  - `subEquipment`, `repairItem`, `normalizedDescription`, `occurrenceCount`, `firstDate`, `lastDate`, `dates`, `workerNames` 포함 확인

화면 HTML/RSC 확인:
- `/input`: `데이터 관리` 표시, `원본 데이터 업로드` 미노출 확인
- `/facility`: `유지보수 분석`, `투입인원 표시` 확인
- `/facility/admin`: `유지보수 분석`, `Admin`, `원본 데이터 업로드` 확인

브라우저 자동화 도구는 현재 세션에서 Node REPL browser 실행 도구가 노출되지 않아 사용하지 못했다. 대신 production HTTP, production API, source verification으로 대체했다.

## 7. TOP10 누적 집계 확인
누적 그룹핑 기준:
- 1단계 작업 이벤트: 년도 + 월 + 일 + 대표설비 + 구성설비 + 수리항목 + 수리유형 + normalized 사고 처리 내용
- 2단계 누적 TOP10: 대표설비 + 구성설비 + 수리항목 + 수리유형 + normalized 사고 처리 내용
- 최종 TOP10 그룹 기준에서 작업일, 작업자, 작업시간은 제외된다.

Production `https://mtbf-dashboard.vercel.app/api/facility/summary?year=2026` 확인 결과:
- `수퍼기어` 항목 2개 원본 행은 하나로 묶였다.
  - `durationMin`: 360
  - `technicianCount`: 2
  - `occurrenceCount`: 1
  - `firstDate` / `lastDate`: `2026-05-18`
  - `workerNames`: `김종필`, `홍성택`
- `스퍼기어` 항목 1개 원본 행은 별도 항목으로 남았다.
  - `durationMin`: 180
  - `technicianCount`: 1
  - `occurrenceCount`: 1
  - `workerNames`: `송광민`
- 분리 원인: normalized 사고 처리 내용이 `수퍼기어`와 `스퍼기어`로 다르다. 오타/유사어 자동 병합은 이번 작업 범위가 아니므로 정상이다.

## 8. /input 정리 확인
- `/input`에서 `RawUploadPanel` import와 원본 데이터 업로드 탭을 제거했다.
- Production HTML에서 `원본 데이터 업로드` 문자열 미노출을 확인했다.
- 기존 월별 데이터 입력 로직은 유지했다.

## 9. /facility/admin 확인
- `src/app/facility/admin/page.tsx`는 계속 `RawUploadPanel`을 import한다.
- Production `/facility/admin`에서 `원본 데이터 업로드` 노출을 확인했다.
- 업로드 기능 제거 없음.

## 10. 변경하지 않은 것
- DB schema 변경 없음
- Prisma migration 생성 없음
- 원본 데이터 삭제 없음
- 원본 행 물리 병합 없음
- 업로드 API 대규모 변경 없음
- MTBF/MTTR 공식 변경 없음
- Non-Repair를 MTBF/MTTR 계산에 섞는 변경 없음
- `/facility/admin` 업로드 기능 제거 없음
- 미추적 로컬 파일 커밋 없음

## 11. 남은 작업
다음 단계로 `/facility/admin` 업로드 미리보기에서 유사 수리내용 후보 승인 기능을 제안한다.

- 같은 대표설비 + 구성설비 + 수리항목 + 수리유형 기준으로 후보 표시
- 사고 처리 내용 유사도 기준으로 후보 표시
- 사용자가 승인하면 분석용 그룹으로 묶기
- 원본 행은 유지
