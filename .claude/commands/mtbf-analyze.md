---
name: mtbf-analyze
description: "@analyst 에이전트를 호출하여 KPI 분석 및 임원 보고용 인사이트 생성."
category: mtbf
complexity: basic
allowed-tools: [Read, Bash]
---

# /mtbf-analyze — KPI 분석 및 인사이트

## 동작
@analyst 에이전트를 호출하여 현재 데이터를 분석하고 임원 보고용 요약을 생성합니다.

## 사용법
```
/mtbf-analyze
/mtbf-analyze [연도]         # 예: /mtbf-analyze 2025
/mtbf-analyze [공장] [연도]  # 예: /mtbf-analyze F2 2025
```

## 실행 순서

### Step 1: 데이터 수집
- `/api/home/kpi` 호출
- `/api/facility/summary?year=N` 호출

### Step 2: KPI 해석
- MTBF 수준 평가 (우수/양호/주의/경고)
- MTTR 수준 평가
- 유지보수 성숙도 평가

### Step 3: 인사이트 생성
- 핵심 이슈 식별
- 권고 사항 도출

### Step 4: 임원 보고 형식 출력

## 출력 예시
```
## 설비 신뢰성 현황 (2026년 1~3월)

평균 MTBF: 106.4h [양호]
평균 MTTR: 0.9h [우수]
Preventive 비율: 85% → 안정적 관리 상태

주요 이슈: 텐타 2호기 고장 집중 (25.9%)
권고: 텐타 2호기 예방보전 일정 재검토
```
