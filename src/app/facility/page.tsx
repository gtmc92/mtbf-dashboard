"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";
import { RepairTypePieChart } from "@/components/facility/RepairTypePieChart";
import { PreventiveReactiveChart } from "@/components/facility/PreventiveReactiveChart";
import { EquipmentTopChart } from "@/components/facility/EquipmentTopChart";
import { ProcessStackedChart } from "@/components/facility/ProcessStackedChart";

interface RepairTypeStat {
  repairType: string;
  count: number;
  durationMin: number;
}

interface ManagementTypeStat {
  managementType: string;
  count: number;
  durationMin: number;
}

interface EquipmentStat {
  equipment: string;
  incidentCount: number;
  totalDurationMin: number;
}

interface TopRepairItem {
  equipment: string;
  repairTime: number;
  repairType: string;
  description: string;
}

interface NonRepairItem {
  equipment: string;
  durationMin: number;
  repairType: string;
  description: string;
}

interface FacilitySummary {
  years: number[];
  total: { incidentCount: number; totalDurationMin: number };
  byRepairType: RepairTypeStat[];
  byManagementType: ManagementTypeStat[];
  topEquipment: EquipmentStat[];
  byEquipmentRepairType: Record<string, unknown>[];
  topRepairs: TopRepairItem[];
  improvementTopItems: NonRepairItem[];
  maintenanceTopItems: NonRepairItem[];
}

function fmtMin(min: number) {
  if (min >= 60) return `${(min / 60).toFixed(1)}h`;
  return `${Math.round(min)}분`;
}

export default function FacilityPage() {
  const [data, setData] = useState<FacilitySummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const toggleExpand = (i: number) =>
    setExpandedRows((prev) => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });

  useEffect(() => {
    const url = selectedYear
      ? `/api/facility/summary?year=${selectedYear}`
      : "/api/facility/summary";
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((d: FacilitySummary) => {
        setData(d);
        if (!selectedYear && d.years.length > 0) {
          setSelectedYear(String(d.years[d.years.length - 1]));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedYear]);

  const totalCount = data?.total.incidentCount ?? 0;
  const totalMin = data?.total.totalDurationMin ?? 0;
  const preventive = data?.byManagementType.find((m) =>
    m.managementType?.toLowerCase().includes("preventive")
  );
  const reactive = data?.byManagementType.find((m) =>
    m.managementType?.toLowerCase().includes("reactive")
  );
  const nonRepairStat = data?.byManagementType.find((m) =>
    m.managementType?.toLowerCase().includes("non-repair")
  );
  const prTotal = (preventive?.count ?? 0) + (reactive?.count ?? 0);

  // 비수리 집계 (byRepairType에서 계산)
  const improvementMin = (data?.byRepairType ?? [])
    .filter((r) => ["일반제작", "개발작업"].includes(r.repairType))
    .reduce((s, r) => s + r.durationMin, 0);
  const maintenanceMin = (data?.byRepairType ?? [])
    .find((r) => r.repairType === "유지보수")?.durationMin ?? 0;
  const nonRepairCount = nonRepairStat?.count ?? 0;
  const nonRepairRatio =
    totalCount > 0 ? Math.round((nonRepairCount / totalCount) * 1000) / 10 : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 홈
          </Link>
          <h1 className="text-xl font-bold text-gray-900">시설 현황</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* 연도 필터 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <label className="text-xs text-gray-500">연도</label>
              <Select
                value={selectedYear}
                onValueChange={(v) => { if (v) setSelectedYear(v); }}
              >
                <SelectTrigger className="w-28">
                  <span className={selectedYear ? "" : "text-muted-foreground"}>
                    {selectedYear ? `${selectedYear}년` : "연도 선택"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(data?.years ?? []).map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center text-gray-400 py-20">
            <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-sm">데이터 불러오는 중...</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 사고·수리 건수</p>
                  <p className="text-2xl font-bold text-blue-600">{totalCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">건</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 수리 시간</p>
                  <p className="text-2xl font-bold text-orange-500">{fmtMin(totalMin)}</p>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(totalMin).toLocaleString()}분</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">Preventive</p>
                  <p className="text-2xl font-bold text-green-600">{preventive?.count.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtMin(preventive?.durationMin ?? 0)}
                    {prTotal > 0 && ` · ${(((preventive?.count ?? 0) / prTotal) * 100).toFixed(1)}%`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">Reactive</p>
                  <p className="text-2xl font-bold text-red-500">{reactive?.count.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtMin(reactive?.durationMin ?? 0)}
                    {prTotal > 0 && ` · ${(((reactive?.count ?? 0) / prTotal) * 100).toFixed(1)}%`}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 수리 유형 의미 설명 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-700">정지수리 증가</p>
                <p className="text-xs text-red-600 mt-1">설비 신뢰성 저하 (고장 발생 증가)</p>
              </div>
              <div className="rounded-lg border-l-4 border-green-400 bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-700">가동수리 증가</p>
                <p className="text-xs text-green-600 mt-1">잠재 고장 증가 (운영 중 불안정 상태)</p>
              </div>
              <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-700">보전수리 증가</p>
                <p className="text-xs text-blue-600 mt-1">예방보전 강화 (관리 상태 양호)</p>
              </div>
              <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-700">휴무수리 증가</p>
                <p className="text-xs text-amber-600 mt-1">예방보전 강화 (관리 상태 양호)</p>
              </div>
            </div>

            {/* ── 비수리 영역 (Non-Repair) ── */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <p className="text-sm font-bold text-indigo-800 mb-3">
                설비 개선 &amp; 유지보수 활동 (Non-Repair)
                <span className="ml-2 text-xs font-normal text-indigo-500">MTBF/MTTR 계산에서 제외된 영역</span>
              </p>

              {/* 비수리 KPI 카드 3개 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">비수리 작업 비율</p>
                  <p className="text-2xl font-bold text-indigo-600">{nonRepairRatio.toFixed(1)}<span className="text-sm ml-1">%</span></p>
                  <p className="text-xs text-gray-400 mt-1">전체 {totalCount.toLocaleString()}건 중 {nonRepairCount.toLocaleString()}건</p>
                </div>
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">개선작업 시간 (일반제작+개발작업)</p>
                  <p className="text-2xl font-bold text-indigo-600">{fmtMin(improvementMin)}</p>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(improvementMin).toLocaleString()}분</p>
                </div>
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">유지보수 시간</p>
                  <p className="text-2xl font-bold text-slate-600">{fmtMin(maintenanceMin)}</p>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(maintenanceMin).toLocaleString()}분</p>
                </div>
              </div>

              {/* 비수리 유형 설명 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-lg border-l-4 border-indigo-400 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-indigo-700">일반제작</p>
                  <p className="text-xs text-indigo-600 mt-0.5">설비·치공구 신규 제작 활동</p>
                </div>
                <div className="rounded-lg border-l-4 border-purple-400 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-purple-700">개발작업</p>
                  <p className="text-xs text-purple-600 mt-0.5">공정 개선 및 기술 개발 활동</p>
                </div>
                <div className="rounded-lg border-l-4 border-slate-400 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-slate-700">유지보수</p>
                  <p className="text-xs text-slate-600 mt-0.5">설비 정기 점검 및 유지 활동</p>
                </div>
              </div>
            </div>

            {/* 핵심 메시지 */}
            {(() => {
              const total = (preventive?.count ?? 0) + (reactive?.count ?? 0);
              if (total === 0) return null;
              const rRatio = (reactive?.count ?? 0) / total;
              const pRatio = (preventive?.count ?? 0) / total;
              if (rRatio > 0.6) return (
                <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4">
                  <p className="text-sm font-bold text-red-700">⚠ Reactive 중심 운영 — 예방 정비 강화 필요</p>
                  <p className="text-xs text-red-600 mt-1">정지·가동 수리 비중이 높습니다. 계획 예방보전(PM) 활동을 강화하여 설비 신뢰성을 개선하세요.</p>
                </div>
              );
              if (pRatio > 0.6) return (
                <div className="rounded-lg bg-green-50 border border-green-200 px-5 py-4">
                  <p className="text-sm font-bold text-green-700">✓ Preventive 중심 운영 — 안정적 관리 상태</p>
                  <p className="text-xs text-green-600 mt-1">예방·휴무 수리 비중이 높습니다. 현재의 예방보전 체계를 유지하세요.</p>
                </div>
              );
              return (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-5 py-4">
                  <p className="text-sm font-bold text-amber-700">→ Reactive → Preventive 전환 진행 중</p>
                  <p className="text-xs text-amber-600 mt-1">예방보전 비중이 증가하고 있습니다. 지속적인 PM 활동으로 Reactive 비중을 낮추세요.</p>
                </div>
              );
            })()}

            {/* 차트 행 1: 수리유형 분포 + Preventive vs Reactive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">수리 유형 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <RepairTypePieChart data={data.byRepairType} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preventive vs Reactive</CardTitle>
                </CardHeader>
                <CardContent>
                  <PreventiveReactiveChart data={data.byManagementType} />
                </CardContent>
              </Card>
            </div>

            {/* 차트 행 2: 설비별 TOP10 + 공정별 수리유형 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">설비별 수리 건수 TOP 10</CardTitle>
                </CardHeader>
                <CardContent>
                  <EquipmentTopChart data={data.topEquipment} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">설비별 수리유형 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessStackedChart data={data.byEquipmentRepairType} />
                </CardContent>
              </Card>
            </div>

            {/* 정지수리 기준 최장 수리 TOP 10 */}
            {data.topRepairs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">정지수리 기준 최장 수리 TOP 10</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topRepairs.map((r, i) => {
                      const isExpanded = expandedRows.has(i);
                      const LIMIT = 60;
                      const isLong = r.description.length > LIMIT;
                      const displayText = isExpanded || !isLong
                        ? r.description
                        : r.description.slice(0, LIMIT) + "…";
                      return (
                        <div key={i} className="flex gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">{r.equipment}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">정지수리</span>
                            </div>
                            {r.description ? (
                              <>
                                <p className="text-sm leading-relaxed text-gray-600">{displayText}</p>
                                {isLong && (
                                  <button
                                    className="text-xs text-blue-500 mt-1 hover:underline"
                                    onClick={() => toggleExpand(i)}
                                  >
                                    {isExpanded ? "접기" : "더보기"}
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* 개선작업 TOP (일반제작+개발작업) */}
            {data.improvementTopItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">개선작업 최장 시간 TOP 10 (일반제작·개발작업)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.improvementTopItems.map((r, i) => {
                      const isExpanded = expandedRows.has(1000 + i);
                      const LIMIT = 60;
                      const isLong = r.description.length > LIMIT;
                      const displayText = isExpanded || !isLong
                        ? r.description
                        : r.description.slice(0, LIMIT) + "…";
                      return (
                        <div key={i} className="flex gap-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">{r.equipment.replace(/^(F1_|F2_)/, "")}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.repairType === "일반제작" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"}`}>
                                {r.repairType}
                              </span>
                              <span className="text-xs text-gray-500">{fmtMin(r.durationMin)}</span>
                            </div>
                            {r.description ? (
                              <>
                                <p className="text-sm leading-relaxed text-gray-600">{displayText}</p>
                                {isLong && (
                                  <button
                                    className="text-xs text-blue-500 mt-1 hover:underline"
                                    onClick={() => toggleExpand(1000 + i)}
                                  >
                                    {isExpanded ? "접기" : "더보기"}
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 유지보수 TOP */}
            {data.maintenanceTopItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">유지보수 최장 시간 TOP 10</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.maintenanceTopItems.map((r, i) => {
                      const isExpanded = expandedRows.has(2000 + i);
                      const LIMIT = 60;
                      const isLong = r.description.length > LIMIT;
                      const displayText = isExpanded || !isLong
                        ? r.description
                        : r.description.slice(0, LIMIT) + "…";
                      return (
                        <div key={i} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-800">{r.equipment.replace(/^(F1_|F2_)/, "")}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700">유지보수</span>
                              <span className="text-xs text-gray-500">{fmtMin(r.durationMin)}</span>
                            </div>
                            {r.description ? (
                              <>
                                <p className="text-sm leading-relaxed text-gray-600">{displayText}</p>
                                {isLong && (
                                  <button
                                    className="text-xs text-blue-500 mt-1 hover:underline"
                                    onClick={() => toggleExpand(2000 + i)}
                                  >
                                    {isExpanded ? "접기" : "더보기"}
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">—</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
