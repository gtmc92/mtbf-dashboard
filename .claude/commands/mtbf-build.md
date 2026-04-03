---
name: mtbf-build
description: "새 기능 구현. @builder 에이전트를 호출하여 코드 수정/생성."
category: mtbf
complexity: standard
allowed-tools: [Read, Write, Edit, Bash]
---

# /mtbf-build — 기능 구현

## 동작
@builder 에이전트를 호출하여 기능을 구현합니다.
구현 전 @planner 설계, 구현 후 @validator 검증을 권장합니다.

## 사용법
```
/mtbf-build [구현할 기능]
```

## 실행 순서

### Step 1: 컨텍스트 확인
- PROJECT_CONTEXT.md 읽기
- 관련 파일 읽기

### Step 2: 구현
- 최소 변경 원칙
- 기존 패턴 유지
- 데이터 규칙 준수

### Step 3: 구현 후 자동 검증
- `/mtbf-validate` 실행 권장

## 핵심 규칙 (자동 적용)
- stopCount=0 → MTBF/MTTR = null
- null → UI에서 "-"
- null → 차트에서 미표시
- 가동시간/정지시간 단위: 분 → /60으로 시간 변환

## 완료 메시지
```
✅ 구현 완료

수정 파일:
- src/app/...
- src/components/...

다음 단계: /mtbf-validate 로 검증하세요.
```
