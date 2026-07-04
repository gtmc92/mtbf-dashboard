# Non-Repair / 작업유형 분석 UI 페이지 역할 정리

- 작업일: 2026-07-04
- commit: 3d6071434cbbdbd53c2d94c44393f3085840135f
- push: origin/main 반영 완료
- 배포 URL: 로컬 Vercel 연결 정보 없음(.vercel/project.json 없음)

## 1. 작업 목표

Data Management 페이지는 업로드/입력 업무만 담당하도록 유지하고, Non-Repair / 작업유형 분석 UI는 Maintenance Analysis 페이지에서 제공하도록 페이지 역할을 정리했다.

## 2. 구현 요약

- 데이터 관리 페이지(`/input`)는 기존 월별 데이터 입력 탭과 원본 데이터 업로드 탭만 유지
- 유지보수 분석 페이지(`/facility`) 제목을 `유지보수 분석`으로 변경
- 시설 현황 페이지(`/status`) 제목을 `시설 현황`으로 변경
- 유지보수 분석 페이지에 필터 확장
  - 연도
  - 월
  - 설비/공정
  - 관리구분
- 유지보수 분석 API에 위 필터 조건과 필터 옵션 응답 추가
- Non-Repair / 작업유형 분석 섹션은 유지보수 분석 페이지에 위치함을 소스 기준으로 확인

## 3. 수정 파일

- `src/app/api/facility/summary/route.ts`
  - `year`, `month`, `equipment`, `managementType` 쿼리 필터 지원
  - 필터 옵션(`months`, `equipment`, `managementTypes`) 응답 추가
  - 기존 집계/차트/TOP10 데이터 로직은 유지하고 where 조건만 필터화
- `src/app/facility/page.tsx`
  - 페이지 제목 `시설 현황` -> `유지보수 분석`
  - 월/설비·공정/관리구분 필터 UI 추가
  - API 호출 쿼리 파라미터 구성 추가
  - 운영 인사이트 문구를 요구사항에 맞게 정리
- `src/app/status/page.tsx`
  - 페이지 제목 `현황 조회` -> `시설 현황`

## 4. 라우팅 정리

| 홈 카드 | 경로 | 역할 |
|---|---|---|
| 데이터 관리 | `/input` | 월별 입력, 원본 업로드, 미리보기, 검증, 적용 이력, 되돌리기 |
| 운영 현황 | `/status` | MTBF/MTTR 기반 시설 현황 |
| 성과 분석 | `/compare` | 기간별 성과 비교 |
| 유지보수 분석 | `/facility` | 수리유형/작업유형/Non-Repair 분석 |

## 5. 유지보수 분석 페이지 포함 섹션

- 필터: 연도, 월, 설비/공정, 관리구분
- 요약 카드
  - 총 사고·수리 건수
  - 총 수리 시간
  - Preventive
  - Reactive
- Non-Repair 섹션
  - 설비 개선 & 유지보수 활동 (Non-Repair)
  - 비수리 작업 비율
  - 개선작업 시간 (일반제작+개발작업)
  - 유지보수 시간
  - 일반제작 / 개발작업 / 유지보수 설명 카드
- 운영 인사이트
  - Non-Repair 증가 -> 개선/투자 활동 증가
  - 정지수리 증가 -> 설비 신뢰성 저하
  - Preventive 중심 운영 -> 안정적 관리 상태
- 차트/TOP10
  - 시설팀 작업시간 분포
  - Preventive vs Reactive vs Non-Repair
  - 설비별 수리 건수 TOP 10
  - 설비별 작업유형 분포
  - 정지수리 기준 최장 수리 TOP 10
  - 개선작업 최장 시간 TOP 10
  - 유지보수 최장 시간 TOP 10

## 6. 데이터 관리 페이지 유지 범위

`/input` 페이지는 다음 upload/input 워크플로만 유지한다.

- 월별 데이터 입력
- 원본 데이터 업로드
- 템플릿 다운로드
- 업로드 미리보기
- 검증 결과
- 적용 이력
- 되돌리기

아래 분석 섹션 문자열이 `/input`과 `RawUploadPanel`에 없음을 `rg`로 확인했다.

- 설비 개선
- 비수리 작업 비율
- 시설팀 작업시간 분포
- Preventive vs Reactive vs Non-Repair
- 설비별 작업유형 분포
- 개선작업 최장 시간
- 유지보수 최장 시간

## 7. 검증 결과

| 항목 | 결과 |
|---|---|
| `npm run build` | OK |
| TypeScript | OK (`next build` 단계 통과) |
| Data Management route | `/input` 200 OK, `데이터 관리` 표시, Non-Repair/차트 섹션 텍스트 없음 |
| Maintenance Analysis route | `/facility` 200 OK, `유지보수 분석` 표시 |
| Facility Status route | `/status` 200 OK, `시설 현황` 표시, 기존 `현황 조회` 제목 없음 |
| Home card routing | `/input`, `/status`, `/compare`, `/facility` 링크 유지 확인 |
| 소스 배치 확인 | Non-Repair/작업유형 분석 문자열은 `src/app/facility/page.tsx`에 존재하고 `/input`에는 없음 |

## 8. 검증 중 참고사항

- 최초 `npm run build`는 Prisma Client DLL 파일 잠금 때문에 실패했다.
  - 원인: 실행 중이던 이 워크스페이스의 Next dev server가 `node_modules/.prisma/client/query_engine-windows.dll.node`를 점유
  - 조치: `mtbf-dashboard` 관련 Next dev/server worker 프로세스만 종료 후 재실행
  - 결과: build 성공
- 전체 `npm run lint`는 기존 코드의 unrelated lint 이슈로 실패했다.
  - 예: `compare/page.tsx`, `status/page.tsx`, `page.tsx`, `RepairTypePieChart.tsx`, `OnboardingModal.tsx`
  - 이번 작업 파일 중 `facility/page.tsx`에 새로 발생한 lint 이슈는 정리함
- 브라우저 커넥터는 이 세션에서 필수 Node REPL 도구가 노출되지 않아 사용하지 못했다.
- 외부 Neon DB 연결을 사용하는 `/api/facility/summary` 런타임 데이터 검증은 로컬 환경에서 타임아웃되어 완료하지 못했다.
  - 단, production build와 라우트 HTML 응답 검증은 통과

## 9. 커밋/푸시

- commit hash: `3d6071434cbbdbd53c2d94c44393f3085840135f`
- commit message: `Move work type analysis to maintenance page`
- push 결과: 성공
  - `7c53a63..3d60714 main -> main`

## 10. 배포 상태

- 로컬 checkout에 `.vercel/project.json`이 없어 Vercel 프로젝트 연결을 확인할 수 없었다.
- 따라서 자동 배포 상태와 Production URL은 로컬에서 검증하지 못했다.
- GitHub `main` push는 완료되었으므로, Vercel이 GitHub main 브랜치에 연결되어 있다면 자동 배포 트리거 대상 상태다.

## 11. 남은 이슈

- Vercel 배포 완료 여부는 Vercel 대시보드 또는 연결된 프로젝트에서 수동 확인 필요
- 전체 lint 정리는 이번 작업 범위를 벗어난 기존 이슈로 남아 있음
- `.claude/settings.local.json`, `.playwright-mcp/`, 이미지 파일 등 기존 로컬 변경/미추적 파일은 이번 커밋에서 제외함
