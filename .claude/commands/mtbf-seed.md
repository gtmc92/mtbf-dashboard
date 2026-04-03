---
name: mtbf-seed
description: "CSV 데이터를 DB에 재적재. DATA_BASE, DATA_PTEAM, DATA_TYPE CSV 업데이트 후 실행."
category: mtbf
complexity: basic
allowed-tools: [Read, Bash]
---

# /mtbf-seed — DB 재적재

## 동작
기존 DB 데이터를 삭제하고 최신 CSV 3개로 완전 재적재합니다.

## 사용법
```
/mtbf-seed
```

## 실행 순서

### Step 1: CSV 확인
- `D:\DATA_BASE\DATA_PTEAM.csv` 존재 확인
- `D:\DATA_BASE\DATA_BASE.csv` 존재 확인
- `D:\DATA_BASE\DATA_TYPE.csv` 존재 확인

### Step 2: seed 실행
```bash
cd "D:\98. D Company\01. Dash Board\mtbf-dashboard"
npm run db:seed
```

### Step 3: 결과 확인
- MonthlyRecord 건수
- IncidentRecord 건수
- RepairTypeRecord 건수

### Step 4: API 검증
```
GET http://localhost:3000/api/home/kpi
→ avgMtbf: null 또는 숫자 (0 이면 오류)
```

## 주의사항
- ⚠️ 기존 데이터 전체 삭제 후 재적재
- 미래 월 (operatingTime=null, stopCount=null) → 자동 skip
- 중복 행 → 자동 deduplicate

## 완료 메시지
```
✅ DB 재적재 완료
   MonthlyRecord   : N건
   IncidentRecord  : N건
   RepairTypeRecord: N건
```
