---
name: data-validator
description: "MTBF/MTTR 데이터 정합성 검증 스킬. null 처리, 단위 변환, 중복 데이터 체크."
---

# Data Validator Skill

## 역할
MTBF 시스템의 데이터 정합성 규칙을 검증합니다.

## 검증 규칙

### Rule 1: MTBF/MTTR null 처리
```
stopCount = 0 → mtbf = null, mttr = null
stopCount > 0 AND operatingTime IS NOT NULL → mtbf = operatingTime / stopCount / 60
```

### Rule 2: 단위 변환
```
가동시간 (분) / stopCount / 60 = MTBF (시간)
정지시간 (분) / stopCount / 60 = MTTR (시간)
```

### Rule 3: 미래 데이터 skip
```
operatingTime = null AND stopCount = null → skip (미입력 행)
```

### Rule 4: 중복 제거
```
(factory, process, year, month) 조합 유니크 보장
```

### Rule 5: UI 표시
```
null → "-" (0 금지)
0 (숫자) → 버그 (null이어야 함)
```

## API 검증 체크포인트
```typescript
// /api/home/kpi 응답 검증
assert(response.avgMtbf !== 0);  // 0이면 stopCount 필터 오류
assert(response.avgMtbf === null || response.avgMtbf > 0);

// /api/records 응답 검증
records.forEach(r => {
  if (r.stopCount === 0) {
    assert(r.mtbf === null);
    assert(r.mttr === null);
  }
});
```

## 검증 실행 순서
1. API 엔드포인트 직접 호출
2. 응답 JSON 파싱
3. 각 Rule 적용
4. 위반 항목 보고
