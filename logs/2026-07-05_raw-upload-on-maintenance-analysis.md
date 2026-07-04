# 원본 데이터 업로드 기능 유지보수 분석 페이지 공유 적용

- 작업일: 2026-07-05
- 대상 경로: `/facility`
- 관련 기존 경로: `/input`
- 주요 컴포넌트: `RawUploadPanel`

## 1. 원인 분석

이전 페이지 역할 정리 작업에서는 `/facility`를 `유지보수 분석` 페이지로 정리하고 Non-Repair / 작업유형 분석 화면과 필터를 배치했다.

하지만 실제 원본 데이터 업로드 workflow는 여전히 `/input`의 `원본 데이터 업로드` 탭 안에서만 접근 가능했다.

운영자가 유지보수 분석 화면에서 바로 수행해야 하는 아래 workflow가 `/facility`에 없었다.

- 원본 양식 다운로드
- CSV/XLSX 파일 선택
- 업로드 및 미리보기
- 검증 결과 확인
- 적용
- 적용 이력
- 되돌리기

## 2. 실제 이동/공유된 컴포넌트

업로드 UI와 workflow는 이미 `src/components/data-upload/RawUploadPanel.tsx`로 공통 컴포넌트화되어 있었다.

이번 작업에서는 중복 구현 없이 동일 컴포넌트를 `/facility`에서도 import하여 재사용했다.

적용 위치:

1. `/facility` 페이지 상단 필터
2. 바로 아래 `원본 데이터 업로드` 섹션
3. 그 아래 기존 KPI / Non-Repair / 차트 / TOP10 분석 영역

`/input` 페이지는 삭제하지 않았고 기존처럼 `RawUploadPanel`을 계속 사용한다.

## 3. 수정 파일

- `src/app/facility/page.tsx`
  - `RawUploadPanel` import 추가
  - 필터 카드 바로 아래 `원본 데이터 업로드` 섹션 추가
  - 기존 KPI, Non-Repair, 차트, TOP10 분석 영역 유지
- `AGENTS.md`
  - 작업 완료/검증/배포 확인 등 주요 작업 후 `logs/`에 최종보고서를 남기는 프로젝트 규칙 추가
- `logs/2026-07-05_raw-upload-on-maintenance-analysis.md`
  - 본 최종보고서 추가

## 4. 보존한 로직

아래 로직은 변경하지 않았다.

- 원본 파일 파싱
- CSV/XLSX 변환
- 미리보기
- 검증 결과
- 적용 API
- 적용 이력 API
- 되돌리기 API
- MTBF/MTTR 계산
- Prisma schema
- CSV parsing/transform 로직

## 5. Build 결과

명령:

```text
npm run build
```

결과:

- Prisma Client generate: OK
- Next.js production build: OK
- TypeScript: OK
- static page generation: OK

빌드 route 목록에 `/facility`, `/input`, `/status`, `/compare`, `/api/facility/summary`, `/api/data/*`가 정상 포함됨을 확인했다.

## 6. Browser / Playwright 검증 결과

검증 방식:

- `npm run build` 후 `next start -p 3002`
- cached Playwright package + system Chrome 사용
- 로컬 production server에서 `/facility` hydrated UI 확인
- Neon DB 접근이 필요하므로 server/browser 검증은 network 권한으로 수행

검증 URL:

- `http://127.0.0.1:3002/facility`

결과:

```json
{
  "title": 1,
  "uploadHeading": 1,
  "downloadButton": 1,
  "fileInput": 1,
  "previewButton": 1,
  "historyText": 1,
  "revertText": 1,
  "nonRepairSection": 1,
  "workTimeChart": 1,
  "pvrChart": 1,
  "equipmentWorkType": 1,
  "uploadAboveAnalysis": true
}
```

의미:

- `/facility` 제목 `유지보수 분석` 표시: OK
- `원본 데이터 업로드` 섹션 표시: OK
- `원본 양식 다운로드 (.csv)` 표시: OK
- 파일 선택 input 존재: OK
- `업로드 및 미리보기` 표시: OK
- `적용 이력` 표시: OK
- `되돌리기` 표시: OK
- 기존 Non-Repair 분석 표시: OK
- 기존 차트 표시: OK
- 업로드 섹션이 KPI/분석 영역보다 위에 있음: OK

## 7. 검증 중 참고사항

- sandbox 상태에서 `next start`가 Neon DB에 접근하지 못해 `/api/facility/summary`, `/api/data/uploads`가 실패했다.
- 동일 검증을 network 권한으로 재실행하자 API와 화면이 정상 로딩되었다.
- `networkidle` 대기 조건은 앱/API 요청 특성상 불안정하여 `domcontentloaded` 후 필수 UI 텍스트를 직접 대기하는 방식으로 검증했다.

## 8. Commit / Push

아직 이 보고서 작성 시점에는 commit/push 전이다.

커밋 후 아래 항목을 최종 응답에서 별도 보고한다.

- commit hash
- push status
- Vercel deployment status

## 9. 남은 이슈

- Production 반영 여부는 commit/push 후 Vercel deployment에서 추가 확인 필요
