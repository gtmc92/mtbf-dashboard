# Vercel Production 배포 및 페이지 역할 정리 라이브 검증

- 작업일: 2026-07-05
- 검증 대상 commit: `3d6071434cbbdbd53c2d94c44393f3085840135f`
- production URL: https://mtbf-dashboard.vercel.app
- Vercel deployment id: `dpl_4f7BvPmVTTgn6g3nbgVVdgrRHRHx`
- Vercel deployment URL: https://mtbf-dashboard-egemprvmi-gtmc92s-projects.vercel.app
- 상태: Ready / Production

## 1. 검증 목표

commit `3d6071434cbbdbd53c2d94c44393f3085840135f`가 Vercel Production에 배포되었는지 확인하고, 라이브 사이트에서 페이지 역할 정리 결과가 실제로 동작하는지 검증했다.

검증 대상 페이지 역할:

| 페이지 | 경로 | 기대 역할 |
|---|---|---|
| 데이터 관리 | `/input` | 월별 입력, 원본 업로드, 미리보기, 검증, 적용 이력, 되돌리기 |
| 시설 현황 | `/status` | MTBF/MTTR 기반 시설 현황 |
| 성과 분석 | `/compare` | 기간별 성과 비교 |
| 유지보수 분석 | `/facility` | 수리유형/작업유형/Non-Repair 분석 |

## 2. Production 배포 확인

Vercel CLI로 production deployment 목록과 상세 정보를 확인했다.

- project: `gtmc92s-projects/mtbf-dashboard`
- latest production deployment: `https://mtbf-dashboard-egemprvmi-gtmc92s-projects.vercel.app`
- alias:
  - `https://mtbf-dashboard.vercel.app`
  - `https://mtbf-dashboard-gtmc92s-projects.vercel.app`
  - `https://mtbf-dashboard-git-main-gtmc92s-projects.vercel.app`
- status: `Ready`
- target: `production`
- created: `2026-07-04 23:26:38 KST`

Build log에서 아래 내용을 확인했다.

```text
Cloning github.com/gtmc92/mtbf-dashboard (Branch: main, Commit: 3d60714)
...
Deployment completed
status ● Ready
```

따라서 production alias `https://mtbf-dashboard.vercel.app`는 commit `3d60714` 기반 deployment를 가리킨다.

## 3. Route 응답 확인

`Invoke-WebRequest`로 production route HTTP 응답을 확인했다.

| Route | 결과 |
|---|---|
| `/` | 200 OK |
| `/input` | 200 OK |
| `/status` | 200 OK |
| `/compare` | 200 OK |
| `/facility` | 200 OK |

응답 헤더에서 `server: Vercel`, `x-vercel-id`가 확인되어 Vercel production 응답임을 확인했다.

## 4. Home 카드 라우팅 검증

시스템 Chrome + cached Playwright로 production 홈 화면을 hydrated 상태에서 확인했다.

| 홈 카드 | 기대 링크 | 결과 |
|---|---|---|
| 데이터 관리 | `/input` | OK |
| 운영 현황 | `/status` | OK |
| 성과 분석 | `/compare` | OK |
| 유지보수 분석 | `/facility` | OK |

검증 결과:

```json
{
  "inputLink": 1,
  "statusLink": 1,
  "compareLink": 1,
  "facilityLink": 1,
  "hasDataCard": 2,
  "hasStatusCard": 2,
  "hasCompareCard": 2,
  "hasFacilityCard": 2
}
```

## 5. Data Management 라이브 검증

검증 URL:

- https://mtbf-dashboard.vercel.app/input

결과:

| 항목 | 결과 |
|---|---|
| title `데이터 관리` | OK |
| `월별 데이터 입력` tab | OK |
| `원본 데이터 업로드` tab | OK |
| Non-Repair 분석 섹션 없음 | OK |
| `시설팀 작업시간 분포` 차트 없음 | OK |

Raw upload tab 클릭 후 확인한 업로드 workflow:

```json
{
  "buttons": [
    "월별 데이터 입력",
    "원본 데이터 업로드",
    "원본 양식 다운로드 (.csv)",
    "업로드 및 미리보기"
  ],
  "hasDownload": true,
  "hasUpload": true,
  "hasApply": true,
  "hasRevert": true
}
```

추가 확인:

- file input: 1개 존재
- preview 관련 텍스트 존재
- 적용 이력 관련 텍스트 존재
- 되돌리기 관련 텍스트 존재
- Non-Repair 분석 섹션: 0
- 작업시간 분포 차트: 0

## 6. Facility Status 라이브 검증

검증 URL:

- https://mtbf-dashboard.vercel.app/status

결과:

| 항목 | 결과 |
|---|---|
| title `시설 현황` | OK |
| old title `현황 조회` 없음 | OK |

검증 결과:

```json
{
  "title": 1,
  "oldTitle": 0
}
```

## 7. Performance Analysis 라이브 검증

검증 URL:

- https://mtbf-dashboard.vercel.app/compare

결과:

- route 200 OK
- 성과/비교 관련 텍스트 확인
- 홈 카드 라우팅 `/compare` 확인

## 8. Maintenance Analysis 라이브 검증

검증 URL:

- https://mtbf-dashboard.vercel.app/facility

결과:

| 항목 | 결과 |
|---|---|
| title `유지보수 분석` | OK |
| Non-Repair section | OK |
| 비수리 작업 비율 | OK |
| 개선작업 시간 | OK |
| 유지보수 시간 | OK |
| 연도 필터 | OK |
| 월 필터 | OK |
| 설비/공정 필터 | OK |
| 관리구분 필터 | OK |
| 시설팀 작업시간 분포 | OK |
| Preventive vs Reactive vs Non-Repair | OK |
| 설비별 작업유형 분포 | OK |

Hydrated UI 검증 결과:

```json
{
  "title": 1,
  "nonRepairSection": 1,
  "nonRepairRatio": 1,
  "improvementTime": 1,
  "maintenanceTime": 1,
  "yearFilter": 1,
  "monthFilter": 1,
  "equipmentFilter": 1,
  "managementFilter": 1,
  "workTimeChart": 1,
  "pvrChart": 1,
  "equipmentWorkType": 1
}
```

## 9. Live API 검증

검증 URL:

- https://mtbf-dashboard.vercel.app/api/facility/summary

결과:

```json
{
  "Years": "2025,2026",
  "HasFilters": true,
  "FilterMonths": "1,2,3,4,5,6,7,8,9,10,11,12",
  "FilterEquipmentCount": 19,
  "ManagementTypes": "Non-Repair,Preventive,Reactive",
  "TotalCount": 3656,
  "HasNonRepairGroup": true,
  "HasRepairTypes": true,
  "HasEquipmentWorkType": true,
  "HasTopRepairs": true,
  "HasImprovementTop": true,
  "HasMaintenanceTop": true
}
```

의미:

- commit `3d60714`에서 추가한 `filters` 응답이 production API에 존재
- Non-Repair / 작업유형 분석 데이터가 production에서 정상 제공됨
- Maintenance Analysis 페이지가 API 데이터를 기반으로 분석 섹션을 렌더링할 수 있음을 확인

## 10. 사용한 검증 방법

- Vercel CLI
  - `vercel ls mtbf-dashboard`
  - `vercel inspect https://mtbf-dashboard-egemprvmi-gtmc92s-projects.vercel.app`
  - `vercel inspect ... --logs`
- HTTP route check
  - `Invoke-WebRequest`
  - `Invoke-RestMethod`
- Hydrated UI check
  - cached Playwright package
  - system Chrome executable
  - localStorage `deerfos_splash_done=1` 설정 후 production 페이지 직접 탐색

## 11. 이슈 및 조치

| 이슈 | 조치 |
|---|---|
| sandbox network 제한으로 최초 Vercel CLI/HTTPS 요청 실패 | escalated network 권한으로 재실행 |
| Vercel JSON inspect가 git SHA를 직접 필드로 노출하지 않음 | build log에서 `Commit: 3d60714` 확인 |
| initial HTML에는 client-rendered 분석 섹션 일부가 없음 | Chrome + Playwright로 hydrated UI 검증 |
| cached Playwright에 browser binary 없음 | 시스템 Chrome 실행 파일 지정 |
| PowerShell stdin 한국어 인코딩으로 locator 깨짐 | Unicode escape 문자열로 재검증 |

## 12. 최종 판단

결과: COMPLETE

- commit `3d6071434cbbdbd53c2d94c44393f3085840135f`는 Vercel Production에 배포됨
- production alias `https://mtbf-dashboard.vercel.app`는 Ready 상태의 해당 deployment를 가리킴
- `/input`은 upload/input 전용 페이지 역할을 유지함
- `/status`는 `시설 현황`으로 표시됨
- `/facility`는 `유지보수 분석`으로 표시되며 Non-Repair / 작업유형 분석과 필터가 정상 표시됨
- 추가 배포나 새 Vercel 프로젝트 생성은 필요 없음

## 13. 남은 작업

- 없음
