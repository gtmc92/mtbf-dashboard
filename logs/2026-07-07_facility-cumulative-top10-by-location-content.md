# Final Report — MTBF-FACILITY-CUMULATIVE-TOP10-BY-LOCATION-CONTENT-001

## 1. Result
PASS

작업일: 2026-07-07
커밋: 미생성
배포: 미수행

## 2. 변경 내용
- `src/app/api/facility/summary/route.ts`
  - `/api/facility/summary` TOP10 집계를 2단계 누적 집계로 변경했다.
  - TOP10 조회 필드에 `subEquipment`, `repairItem`, `technician`을 추가했다.
  - 사고 처리 내용 비교용 normalize 함수를 추가하고 원본 표시값은 덮어쓰지 않았다.
  - 응답 항목에 `occurrenceCount`, `firstDate`, `lastDate`, `dates`, `workerNames`, `normalizedDescription`을 추가했다.
- `src/components/facility/MaintenanceAnalysisView.tsx`
  - TOP10 제목을 `정지수리 누적 TOP 10`, `제작설치 누적 TOP 10`, `개발작업 누적 TOP 10`, `유지보수 누적 TOP 10`으로 변경했다.
  - TOP10 항목 표시를 위치, 유형 배지, 총 투입공수, 발생건수, 투입인원 합계, 날짜, 대표 사고 처리 내용 중심으로 변경했다.
  - `투입인원 표시` 체크박스를 추가하고 `localStorage` 키 `facilityTop10ShowTechnicianCount`에 저장하도록 했다.
- `src/app/input/page.tsx`
  - `/input`의 원본 데이터 업로드 탭과 `RawUploadPanel` 노출을 제거했다.
  - 기존 월별 데이터 입력 화면은 유지했다.

## 3. TOP10 누적 그룹핑 기준
1단계 작업 이벤트 그룹핑 기준:
- 년도
- 월
- 일
- 대표설비
- 구성설비
- 수리항목
- 수리유형
- normalized 사고 처리 내용

1단계 제외 기준:
- 조치자
- 작업시간

2단계 누적 TOP10 그룹핑 기준:
- 대표설비
- 구성설비
- 수리항목
- 수리유형
- normalized 사고 처리 내용

2단계 제외 기준:
- 작업일
- 조치자
- 작업시간

## 4. 발생건수 / 투입공수 / 투입인원 기준
- `발생 N건`: 1단계 작업 이벤트 수다. 같은 날짜의 같은 위치·같은 내역은 원본 행이 여러 개여도 1건으로 계산한다.
- `총 투입공수`: 1단계 이벤트의 `durationMin` 합계를 다시 2단계에서 누적한 값이다.
- `투입인원 합계`: 1단계 이벤트의 `technicianCount` 합계를 다시 2단계에서 누적한 값이다. 고유 인원 수가 아니라 공수 관점의 합계다.
- 화면의 사고 처리 내용은 DB 원본을 덮어쓰지 않고 대표 원문을 표시한다.

## 5. 정지수리 누적 TOP10 확인
DB 직접 확인 결과, 2026년 `생산 유턴 바끼임` 원본 행은 3개였다.

- 김종필: `수퍼기어`, 180분, 조치인원 1명
- 홍성택: `수퍼기어`, 180분, 조치인원 1명
- 송광민: `스퍼기어`, 180분, 조치인원 1명

`/api/facility/summary?year=2026` 직접 핸들러 검증 결과:
- `수퍼기어` 2개 행은 하나의 누적 항목으로 묶였다.
  - `durationMin`: 360
  - `technicianCount`: 2
  - `occurrenceCount`: 1
  - `firstDate` / `lastDate`: `2026-05-18`
- `스퍼기어` 1개 행은 별도 항목으로 남았다.
  - 원인: normalized 사고 처리 내용이 `수퍼기어`와 `스퍼기어`로 다르다.
  - 이는 오타/유사어 자동 병합 금지 기준에 따른 정상 동작이다.

## 6. /input 정리 결과
`/input`에서 `RawUploadPanel` import와 `원본 데이터 업로드` 탭을 제거했다. 월별 데이터 입력 기능은 유지했다.

## 7. /facility/admin 확인
`src/app/facility/admin/page.tsx`는 계속 `RawUploadPanel`을 import하고 `원본 데이터 업로드` 섹션을 렌더링한다. `/facility/admin` 업로드 기능은 제거하지 않았다.

## 8. 투입인원 표시 모드
- `/facility` 필터 영역에 `투입인원 표시` 체크박스를 추가했다.
- ON: `총 투입공수 ... · 발생 ...건 · 투입인원 합계 ...명`
- OFF: `총 투입공수 ... · 발생 ...건`
- 상태는 `localStorage` 키 `facilityTop10ShowTechnicianCount`에 저장된다.

## 9. 검증 결과
- `npx eslint src/app/api/facility/summary/route.ts src/components/facility/MaintenanceAnalysisView.tsx`: PASS
- `npm run build`: PASS
  - Prisma Client 생성 성공
  - Next.js 16.2.1 production build 성공
  - route 목록에 `/input`, `/facility`, `/facility/admin`, `/api/facility/summary` 포함
- 직접 API 핸들러 검증:
  - `/api/facility/summary?year=2026&month=3`: PASS
    - TOP10 응답에 `subEquipment`, `repairItem`, `normalizedDescription`, `occurrenceCount`, `firstDate`, `lastDate` 포함 확인
    - 예: 유지보수 항목 `빈 코팅 도포기 트윈펌프 분해 청소`은 `occurrenceCount: 4`, `firstDate: 2026-03-02`, `lastDate: 2026-03-30`
  - `/api/facility/summary?year=2026`: PASS
    - `생산 유턴 바끼임` exact normalized 항목 묶임과 오타 차이 항목 분리 확인
- local production server smoke check:
  - `Start-Process` 실행이 Windows 환경 변수 중복 오류(`Path`/`PATH`)로 시작 전에 실패했다.
  - 대체 검증으로 빌드와 직접 API 핸들러 DB 검증을 수행했다.

## 10. 변경하지 않은 것
- DB schema 변경 없음
- Prisma migration 생성 없음
- 원본 데이터 삭제 없음
- 원본 행 물리 병합 없음
- 업로드/변환 API 대규모 변경 없음
- MTBF/MTTR 공식 변경 없음
- Non-Repair를 MTBF/MTTR 계산에 섞는 변경 없음
- `/facility/admin` 업로드 기능 제거 없음
- 오타/유사어 자동 병합 구현 없음

## 11. 다음 제안
다음 단계로 `/facility/admin` 업로드 미리보기에서 유사 수리내용 후보 승인 기능을 추가하는 것이 좋다.

- 같은 대표설비 + 구성설비 + 수리항목 + 수리유형 기준으로 후보 표시
- 사고 처리 내용 유사도 기준으로 후보 표시
- 사용자가 승인하면 분석용 그룹으로 묶기
- 원본 행은 유지
