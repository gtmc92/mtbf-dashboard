---
name: mtbf-validate
description: "구현 후 전체 체크리스트 검증. @validator 에이전트를 호출하여 Playwright MCP로 자동 검증."
category: mtbf
complexity: basic
allowed-tools: [Read, Bash, mcp__playwright__*]
---

# /mtbf-validate — 전체 검증

## 동작
@validator 에이전트를 호출하여 전체 페이지를 자동 검증합니다.

## 사용법
```
/mtbf-validate
/mtbf-validate [특정 페이지]   # 예: /mtbf-validate status
```

## 실행 순서

### Step 1: 서버 확인
```
browser_navigate → http://localhost:3000
→ HTTP 200 확인
```

### Step 2: 홈 검증
- KPI 카드 6개
- avgMtbf/avgMttr null → "-"
- 연속 무고장 카드
- Alert 메시지

### Step 3: 운영 현황 검증
- 공장 선택 후 데이터 로드
- MTBF/MTTR 표시 검증
- 차트 막대 null 처리

### Step 4: 성과 분석 검증
- 비교 안내 메시지
- 요약표 null → "-"

### Step 5: 유지보수 분석 검증
- 핵심 메시지 카드
- 차트 정상 렌더링

## 완료 메시지
```
✅ 검증 완료

| 페이지 | 항목 | 결과 |
|--------|------|------|
| 홈 | KPI 6개 | ✅ |
| 홈 | MTBF "-" | ✅ |
| ...

이슈: N건
```
