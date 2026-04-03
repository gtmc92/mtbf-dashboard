# 작업 커맨드 표준 템플릿

## 사용법

작업을 요청할 때 아래 구조를 따라 주세요.

---

## 표준 커맨드 구조

```
현상태:
(현재 코드/데이터 상태 설명)

목표:
(달성할 것)

이번 작업:
1. (구체 작업 내용)
2. ...

출력:
- (필요 결과물)

작업결과 보고:
- (검증 및 결과 설명)
```

---

## 예시 1 — 새 기능 추가

```
현상태:
- facility/page.tsx에 수리 유형 분포 차트가 있음
- 월별 트렌드는 없음

목표:
- 월별 수리 건수 추이 차트 추가

이번 작업:
1. /api/facility/summary에 월별 집계 데이터 추가
2. facility/page.tsx에 라인 차트 컴포넌트 추가

출력:
- 수정된 route.ts
- 수정된 facility/page.tsx

작업결과 보고:
- Playwright로 /facility 접속 후 월별 차트 표시 확인
```

---

## 예시 2 — 버그 수정

```
현상태:
- 홈 KPI에서 avgMtbf가 "0h"로 표시됨
- 실제로는 "-"이어야 함

목표:
- avgMtbf null인 경우 "-" 표시

이번 작업:
1. /api/home/kpi에서 stopCount=0 레코드 필터링
2. KPISection.tsx null 처리 확인

출력:
- 수정된 route.ts

작업결과 보고:
- API 응답에서 avgMtbf: null 확인
- UI에서 "-" 표시 확인
```

---

## 커맨드 목록

| 커맨드 | 용도 |
|--------|------|
| /mtbf-seed | CSV → DB 재적재 |
| /mtbf-validate | 전체 페이지 자동 검증 |
| /mtbf-analyze | KPI 분석 및 인사이트 |
| /mtbf-build | 새 기능 구현 |
