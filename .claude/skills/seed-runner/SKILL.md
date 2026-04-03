---
name: seed-runner
description: "CSV 기반 DB 재적재 스킬. DATA_PTEAM, DATA_BASE, DATA_TYPE CSV를 DB에 적재."
---

# Seed Runner Skill

## 역할
CSV 파일을 읽어 DB를 완전 재적재합니다. 수정/추가 데이터 모두 반영합니다.

## CSV 위치
```
D:\DATA_BASE\DATA_PTEAM.csv   → MonthlyRecord (생산 KPI)
D:\DATA_BASE\DATA_BASE.csv    → IncidentRecord (시설 원장)
D:\DATA_BASE\DATA_TYPE.csv    → RepairTypeRecord (수리 유형)
```

## seed.ts 핵심 로직

### PTEAM 처리 규칙
```typescript
// 1. 미래 데이터 skip
if (operatingTime === null && stopCountRaw === null) return;

// 2. MTBF/MTTR 계산 (null 처리)
const mtbf = stopCount > 0 && operatingTime !== null
  ? operatingTime / stopCount  // 분 단위로 저장
  : null;

// 3. 중복 제거 (마지막 값 유지)
dedupMap.set(`${factory}::${process}::${year}::${month}`, row);
```

### 실행 명령
```bash
cd "D:\98. D Company\01. Dash Board\mtbf-dashboard"
npm run db:seed
```

## 예상 결과
```
MonthlyRecord   : ~192건
IncidentRecord  : ~872건
RepairTypeRecord: ~872건
```

## 오류 대응
| 오류 | 원인 | 조치 |
|------|------|------|
| CSV 파일 없음 | 경로 오류 | D:\DATA_BASE\ 확인 |
| Foreign key 오류 | 삭제 순서 오류 | seed.ts 삭제 순서 확인 |
| 중복 키 오류 | dedupMap 미작동 | processId_year_month 유니크 제약 확인 |
