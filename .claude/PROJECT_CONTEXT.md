# MTBF Dashboard — 프로젝트 컨텍스트

## 시스템 개요

디어포스(DEERFOS) 설비 신뢰성 관리 & 분석 플랫폼.
생산 KPI(MTBF/MTTR)와 시설 유지보수 데이터를 통합 관리하는 내부 대시보드.

- **스택**: Next.js (App Router) + Prisma + PostgreSQL(Neon) + Vercel
- **차트**: Recharts
- **검증**: Playwright MCP

---

## 메뉴 구조

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 데이터 관리 | /input | 월별 생산 KPI 수기 입력 |
| 운영 현황 | /status | 공장/연도별 MTBF·MTTR 조회 |
| 성과 분석 | /compare | 연도 간 KPI 비교 |
| 유지보수 분석 | /facility | 수리 유형 및 설비 분석 |

---

## 데이터 소스

| 파일 | 테이블 | 용도 |
|------|--------|------|
| DATA_PTEAM.csv | MonthlyRecord | 생산 KPI (가동시간/정지횟수/정지시간) |
| DATA_BASE.csv | IncidentRecord | 시설 사고·수리 원장 |
| DATA_TYPE.csv | RepairTypeRecord | 수리 유형 집계 |

CSV 경로: `D:\DATA_BASE\DATA_*.csv`

---

## 핵심 KPI 정의

### MTBF (Mean Time Between Failures) — 고장 간격
```
MTBF = 가동시간(분) ÷ 정지횟수 ÷ 60  →  시간(h) 단위
```

### MTTR (Mean Time To Repair) — 수리 복구시간
```
MTTR = 정지시간(분) ÷ 정지횟수 ÷ 60  →  시간(h) 단위
```

---

## 절대 준수 데이터 규칙

1. 정지횟수 = 0 → MTBF / MTTR = **null** (0 절대 금지)
2. UI 표시: null → **"-"** (숫자 0 표시 금지)
3. 차트: null → **null** (0으로 대체 금지, 막대 미표시)
4. 무고장 상태는 "기간 KPI"로 해석
5. 공장/공정 ID 숫자 UI 노출 금지
6. seed 시 operatingTime·stopCount 모두 null인 행 = 미래 데이터 → skip

---

## 수리 유형 분류

| 유형 | 관리구분 | 의미 |
|------|----------|------|
| 정지수리 | Reactive | 설비 완전 정지 후 수리 → 신뢰성 저하 |
| 가동수리 | Reactive | 가동 중 수리 → 잠재 고장 증가 |
| 보전수리 | Preventive | 예방 정비 → 관리 양호 |
| 휴무수리 | Preventive | 휴무 중 정비 → 관리 양호 |

### 핵심 메시지 조건 (facility 페이지)

| 조건 | 메시지 |
|------|--------|
| Reactive > 60% | Reactive 중심 운영 — 예방 정비 강화 필요 |
| Preventive > 60% | Preventive 중심 운영 — 안정적 관리 상태 |
| 그 외 | Reactive → Preventive 전환 진행 중 |

---

## 연속 무고장 계산 원칙

- 현재 월부터 역순으로 stopCount = 0인 달 카운트
- 연도 경계를 넘어도 이어서 계산
- 데이터 없는 달은 skip
- 최초 고장 발생 달에서 중단

---

## 주요 API 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| GET /api/home/kpi | 홈 KPI 집계 (stopCount>0 필터) |
| GET /api/records | 월별 생산 KPI 조회 |
| POST /api/records | 월별 생산 KPI 저장 |
| GET /api/facility/summary | 시설 유지보수 집계 |
| GET /api/factories | 공장 목록 |
| GET /api/processes | 공정 목록 |

---

## 파일 구조 (주요)

```
src/
├── app/
│   ├── page.tsx              # 홈 (KPI 요약 + 알림)
│   ├── input/page.tsx        # 데이터 입력
│   ├── status/page.tsx       # 운영 현황
│   ├── compare/page.tsx      # 성과 분석
│   ├── facility/page.tsx     # 유지보수 분석
│   └── api/
│       ├── home/kpi/route.ts
│       ├── records/route.ts
│       └── facility/summary/route.ts
├── components/
│   ├── home/KPISection.tsx
│   ├── home/AlertSection.tsx
│   └── facility/
prisma/
├── schema.prisma
└── seed.ts                   # CSV → DB 적재
```
