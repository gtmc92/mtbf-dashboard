# 원본 데이터 업로드 -> DATA_BASE 자동 변환 시스템 구축

- 작업일: 2026-07-03
- commit: 7c53a63
- 배포 URL: https://mtbf-dashboard.vercel.app

## 1. 구현 요약

- 원본 업로드 기능: CSV/XLSX 파일 업로드, 컬럼 별칭 자동 매핑(수리일/일자/작업일 등)
- 변환 기능: Power Query 대체 - 날짜/시간 파싱(다양한 형식 + Excel serial), 자정 넘김 처리, 수리시간 계산, 관리구분 자동 매핑
- 검증 기능: 행별 에러/경고 판정, 필수 컬럼 누락 시 파일 레벨 차단
- 적용 기능: 지정 기간 교체(기본) / 전체 교체 / 추가만 하기, 트랜잭션 처리, 백업 스냅샷 + 되돌리기

## 2. 수정 파일

- prisma/schema.prisma: UploadBatch, UploadStagingRow 추가, RepairTypeRecord.uploadBatchId 추가
- prisma/migrations/20260703165224_add_upload_batch_tables/: 신규 마이그레이션 (additive만)
- src/lib/dataUpload/*: 변환 엔진 8개 파일 (별칭매핑 / 날짜파싱 / 시간파싱 / 관리구분 / 변환 오케스트레이터 / 파일파서 / CSV파서 / 타입)
- src/app/api/data/*: 업로드 / 적용 / 템플릿 / 이력 / 되돌리기 API 5개
- src/components/data-upload/RawUploadPanel.tsx: 업로드 UI 전체
- src/app/input/page.tsx: 탭 구조로 확장 ("월별 데이터 입력" + "원본 데이터 업로드")
- prisma/seed-data/sample-raw-upload*.csv: 테스트 샘플 2종
- package.json: exceljs 의존성 추가

## 3. 변환 규칙

| 항목 | 규칙 |
|---|---|
| 날짜 | YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD / M-D-YYYY / Excel serial 지원 -> 년/월/일/분기 산출 |
| 시간 | HH:mm / 오전·오후 / AM·PM / Excel time value 지원, 자정 넘김 시 +1440분(경고 표시) |
| 수리시간 | 시간(분) x 조치인원 (누락 시 기본 1 + 경고) |
| 건수 | 유효 행당 1 |
| 관리구분 | RepairTypeMaster 기준표 우선 -> 고정 매핑(휴무/보전수리->Preventive 등) -> 미등록 시 미분류 + 경고 |
| 수리항목 | 원본 컬럼/별칭 있으면 사용, 없으면 null |
| F1/F2 | 기존 규칙 그대로 유지 (F1은 저장은 되지만 시설현황 페이지 필터에서 기존처럼 제외됨을 확인) |

## 4. API

- 업로드: POST /api/data/upload/raw
- 적용: POST /api/data/apply
- 템플릿 다운로드: GET /api/data/template/raw
- 이력: GET /api/data/uploads
- 되돌리기 (보너스 안전장치): POST /api/data/uploads/[id]/revert

## 5. UI

- 데이터 관리 페이지: /input (2탭 구조)
- 미리보기: 스펙 지정 12개 컬럼 + 상태(OK/WARN/ERROR) 뱃지
- 검증 결과: 행별 에러/경고 목록, 에러 있으면 적용 버튼 비활성화
- 적용 이력: 적용일시 / 파일명 / 기간 / 행수 / 방식 / 상태 / 오류 / 경고 + 되돌리기 버튼

## 6. Playwright 검증 결과

| 시나리오 | 결과 |
|---|---|
| 데이터 관리 페이지 탭 전환 | OK |
| 정상 샘플 CSV 업로드 (12행, 별칭 헤더 포함) | OK |
| 미리보기 수치 (자정 넘김 240분/720분, 휴무수리 540분/2160분 등) | OK |
| 검증 - 정상 케이스 (경고 1건: 자정 넘김) | OK |
| 검증 - 에러 케이스 (대표설비 누락/날짜 파싱 실패/시간 파싱 실패 3건 감지, 적용 버튼 비활성화) | OK |
| 적용 (지정 기간 교체, 2026-06, DB 3834 -> 3846건) | OK |
| 홈 KPI 갱신 (총 수리건수 848건, 무고장 공정 비율 "2026년 6월 기준") | OK |
| 시설현황 갱신 (years에 2026 포함, TOP10 영향도 1위에 신규 정지수리 720분 반영, F1 제외 유지) | OK |
| 되돌리기 (DB 3846 -> 3834건, 홈 KPI 848 -> 836건 원복) | OK |
| Production 최종 확인 (mtbf-dashboard.vercel.app/input 200 OK, 탭 정상 렌더링) | OK |

## 7. 커밋/푸시/배포

- commit hash: 7c53a63
- push 결과: 성공 (515d18f..7c53a63 main -> main)
- 배포 URL: https://mtbf-dashboard.vercel.app (Ready, Production)

## 8. 운영 방법

- 4~6월 원본 파일 업로드: /input -> "원본 데이터 업로드" 탭 -> (선택) 템플릿 다운로드 -> 원본 CSV/XLSX 선택 -> "업로드 및 미리보기" -> 미리보기/검증 확인
- 적용 방식 선택: 기본값 "지정 기간 교체" (업로드 데이터의 년월 범위를 자동 감지해 해당 기간 기존 데이터만 교체). "전체 교체"는 전체 데이터 재구성 시, "추가만 하기"는 기존 데이터 보존하며 신규 행만 추가할 때 사용
- 적용 후 확인: 홈 / 시설현황 / 유지보수 분석 페이지에서 즉시 반영 확인 가능. 문제 발생 시 "적용 이력" 표의 "되돌리기" 버튼으로 즉시 원복

## 9. 남은 이슈

- 업로드/적용 API에 별도 인증 없음 (기존 /api/records와 동일한 무인증 정책 유지)
- 적용되지 않고 방치된 PREVIEWED 배치의 staging 행을 자동 정리하는 TTL/정리 작업 없음 (수동으로 쌓일 수 있으나 대시보드 동작에는 영향 없음)
- 적용 기간은 자동 감지만 지원하며, 미리보기 화면에서 기간을 수동으로 조정하는 UI는 없음 (필요 시 추가 가능)
- .claude/settings.local.json 변경사항은 이번 작업과 무관하여 커밋에서 제외함 (로컬 권한 설정으로 보임, 필요 시 별도 확인 요망)

## 10. DB 마이그레이션 안전성 확인 기록

- 운영 Neon DB에 직접 적용된 마이그레이션이므로, 적용 전 생성된 SQL을 스키마 파일 diff(DB 미접속)로 미리 확인함
- DROP TABLE / DROP COLUMN / DELETE / ALTER COLUMN NOT NULL 없음을 확인 후 진행
- 적용 SQL: ALTER TABLE(nullable 컬럼 추가) 1건, CREATE TABLE 2건, ADD CONSTRAINT(FK) 2건 - 전부 additive
- 적용 전후 RepairTypeRecord count 비교로 기존 데이터(3834건) 무손실 확인
