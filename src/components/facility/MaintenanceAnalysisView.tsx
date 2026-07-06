"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Link from "next/link";
import { FABRICATION_INSTALL_REPAIR_TYPE } from "@/lib/repairTypes";
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
  durationMin: number;
  technicianCount: number;
  repairType: string;
  description: string;
}

interface NonRepairItem {
  equipment: string;
  durationMin: number;
  technicianCount: number;
  repairType: string;
  description: string;
}

interface MtbfMttrComparison {
  year: number;
  previousYear: number;
  endMonth: number;
  mtbf: number | null;
  mttr: number | null;
  previousMtbf: number | null;
  previousMttr: number | null;
  mtbfChangePct: number | null;
  mttrChangePct: number | null;
}

interface FacilitySummary {
  years: number[];
  filters: {
    months: number[];
    equipment: string[];
    managementTypes: string[];
  };
  total: { incidentCount: number; totalDurationMin: number };
  byRepairType: RepairTypeStat[];
  byManagementType: ManagementTypeStat[];
  topEquipment: EquipmentStat[];
  byEquipmentRepairType: Record<string, unknown>[];
  topRepairs: TopRepairItem[];
  fabricationInstallTopItems: NonRepairItem[];
  developmentTopItems: NonRepairItem[];
  maintenanceTopItems: NonRepairItem[];
  mtbfMttrComparison: MtbfMttrComparison;
}

interface MaintenanceAnalysisViewProps {
  title?: string;
  afterFilters?: ReactNode;
  titleAccessory?: ReactNode;
}

function fmtMin(min: number) {
  if (min >= 60) return `${(min / 60).toFixed(1)}h`;
  return `${Math.round(min)}분`;
}

function fmtRatio(count: number, total: number) {
  return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0.0%";
}

function fmtMetric(value: number | null, digits: number) {
  return value === null ? "-" : `${value.toFixed(digits)}h`;
}

function changeLabel(value: number | null) {
  if (value === null) return "-";
  if (value === 0) return "0.0%";
  return `${value > 0 ? "↑" : "↓"}${Math.abs(value).toFixed(1)}%`;
}

export function MaintenanceAnalysisView({
  title = "유지보수 분석",
  afterFilters,
  titleAccessory,
}: MaintenanceAnalysisViewProps) {
  const [data, setData] = useState<FacilitySummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");
  const [selectedManagementType, setSelectedManagementType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const toggleExpand = (i: number) =>
    setExpandedRows((prev) => {
      const s = new Set(prev);
      if (s.has(i)) {
        s.delete(i);
      } else {
        s.add(i);
      }
      return s;
    });

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    if (selectedMonth !== "all") params.set("month", selectedMonth);
    if (selectedEquipment !== "all") params.set("equipment", selectedEquipment);
    if (selectedManagementType !== "all") params.set("managementType", selectedManagementType);
    const url = params.size > 0
      ? `/api/facility/summary?${params.toString()}`
      : "/api/facility/summary";
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
  }, [selectedYear, selectedMonth, selectedEquipment, selectedManagementType]);

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

  const repairTypeCount = (repairType: string) =>
    data?.byRepairType.find((r) => r.repairType === repairType)?.count ?? 0;
  const nonRepairCount = nonRepairStat?.count ?? 0;
  const fabricationInstallCount = repairTypeCount(FABRICATION_INSTALL_REPAIR_TYPE);
  const developmentCount = repairTypeCount("개발작업");
  const maintenanceCount = repairTypeCount("유지보수");
  const mtbfMttr = data?.mtbfMttrComparison;
  const renderTopWorkSection = (
    title: string,
    items: NonRepairItem[],
    rowOffset: number,
    rowClass: string,
    badgeClass: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((r, i) => {
              const rowKey = rowOffset + i;
              const isExpanded = expandedRows.has(rowKey);
              const LIMIT = 60;
              const isLong = r.description.length > LIMIT;
              const displayText = isExpanded || !isLong
                ? r.description
                : r.description.slice(0, LIMIT) + "…";
              return (
                <div key={`${r.equipment}-${i}`} className={`flex gap-3 rounded-lg border px-4 py-3 ${rowClass}`}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/80 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-800">{r.equipment.replace(/^(F1_|F2_)/, "")}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{r.repairType}</span>
                      <span className="text-xs text-gray-500">총 작업시간 {fmtMin(r.durationMin)}</span>
                      <span className="text-xs text-gray-500">투입인원 {r.technicianCount.toLocaleString()}명</span>
                    </div>
                    {r.description ? (
                      <>
                        <p className="text-sm leading-relaxed text-gray-600">{displayText}</p>
                        {isLong && (
                          <button
                            className="text-xs text-blue-500 mt-1 hover:underline"
                            onClick={() => toggleExpand(rowKey)}
                          >
                            {isExpanded ? "접기" : "더보기"}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">-</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 홈
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {titleAccessory}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* 연도 필터 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">연도</label>
                <Select
                  value={selectedYear}
                  onValueChange={(v) => {
                    if (v) {
                      setSelectedYear(v);
                      setSelectedMonth("all");
                      setSelectedEquipment("all");
                      setSelectedManagementType("all");
                    }
                  }}
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

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">월</label>
                <Select
                  value={selectedMonth}
                  onValueChange={(v) => {
                    if (v) setSelectedMonth(v);
                  }}
                >
                  <SelectTrigger className="w-28">
                    <span className={selectedMonth !== "all" ? "" : "text-muted-foreground"}>
                      {selectedMonth === "all" ? "전체" : `${selectedMonth}월`}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {(data?.filters.months ?? []).map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {m}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">설비/공정</label>
                <Select
                  value={selectedEquipment}
                  onValueChange={(v) => {
                    if (v) setSelectedEquipment(v);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <span className={selectedEquipment !== "all" ? "" : "text-muted-foreground"}>
                      {selectedEquipment === "all" ? "전체" : selectedEquipment}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {(data?.filters.equipment ?? []).map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">관리구분</label>
                <Select
                  value={selectedManagementType}
                  onValueChange={(v) => {
                    if (v) setSelectedManagementType(v);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <span className={selectedManagementType !== "all" ? "" : "text-muted-foreground"}>
                      {selectedManagementType === "all" ? "전체" : selectedManagementType}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {(data?.filters.managementTypes ?? []).map((managementType) => (
                      <SelectItem key={managementType} value={managementType}>
                        {managementType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {afterFilters}

        {loading && (
          <div className="text-center text-gray-400 py-20">
            <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-sm">데이터 불러오는 중...</p>
          </div>
        )}

        {!loading && data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">시설팀 작업 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">시설팀 총 작업건수</p>
                    <p className="text-2xl font-bold text-blue-600">{totalCount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Preventive · Reactive · Non-Repair 포함</p>
                  </div>
                  <div className="rounded-lg border bg-white px-4 py-3">
                    <p className="text-xs text-gray-500 mb-1">시설팀 총 작업시간</p>
                    <p className="text-2xl font-bold text-orange-500">{fmtMin(totalMin)}</p>
                    <p className="text-xs text-gray-400 mt-1">{Math.round(totalMin).toLocaleString()}분</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">작업유형 현황</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-green-50 px-4 py-3">
                      <p className="text-sm font-semibold text-green-700">Preventive</p>
                      <p className="mt-2 text-2xl font-bold text-green-700">{(preventive?.count ?? 0).toLocaleString()}건</p>
                      <p className="text-xs text-green-600 mt-1">{fmtRatio(preventive?.count ?? 0, totalCount)}</p>
                    </div>
                    <div className="rounded-lg border bg-red-50 px-4 py-3">
                      <p className="text-sm font-semibold text-red-700">Reactive</p>
                      <p className="mt-2 text-2xl font-bold text-red-700">{(reactive?.count ?? 0).toLocaleString()}건</p>
                      <p className="text-xs text-red-600 mt-1">{fmtRatio(reactive?.count ?? 0, totalCount)}</p>
                    </div>
                    <div className="rounded-lg border bg-indigo-50 px-4 py-3">
                      <p className="text-sm font-semibold text-indigo-700">Non-Repair</p>
                      <p className="mt-2 text-2xl font-bold text-indigo-700">{nonRepairCount.toLocaleString()}건</p>
                      <p className="text-xs text-indigo-600 mt-1">{fmtRatio(nonRepairCount, totalCount)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mtbfMttr && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    MTBF / MTTR 동년 누적 비교
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">MTBF · {mtbfMttr.year}년 1월~{mtbfMttr.endMonth}월</p>
                      <p className="text-2xl font-bold text-blue-600">{fmtMetric(mtbfMttr.mtbf, 1)}</p>
                      <p className={`text-xs mt-1 ${(mtbfMttr.mtbfChangePct ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {changeLabel(mtbfMttr.mtbfChangePct)}
                        <span className="text-gray-400 ml-1">(전년 동기 {fmtMetric(mtbfMttr.previousMtbf, 1)})</span>
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">MTTR · {mtbfMttr.year}년 1월~{mtbfMttr.endMonth}월</p>
                      <p className="text-2xl font-bold text-orange-500">{fmtMetric(mtbfMttr.mttr, 2)}</p>
                      <p className={`text-xs mt-1 ${(mtbfMttr.mttrChangePct ?? 0) <= 0 ? "text-green-600" : "text-red-600"}`}>
                        {changeLabel(mtbfMttr.mttrChangePct)}
                        <span className="text-gray-400 ml-1">(전년 동기 {fmtMetric(mtbfMttr.previousMttr, 2)})</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                Non-Repair 작업
                <span className="ml-2 text-xs font-normal text-indigo-500">MTBF/MTTR 계산에서 제외된 영역</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-sm font-semibold text-indigo-700">Non-Repair</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-600">{nonRepairCount.toLocaleString()}건</p>
                  <p className="text-xs text-indigo-500 mt-1">{fmtRatio(nonRepairCount, totalCount)}</p>
                </div>
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-sm font-semibold text-indigo-700">제작설치</p>
                  <p className="mt-2 text-xl font-bold text-indigo-600">{fabricationInstallCount.toLocaleString()}건</p>
                </div>
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-sm font-semibold text-purple-700">개발작업</p>
                  <p className="mt-2 text-xl font-bold text-purple-600">{developmentCount.toLocaleString()}건</p>
                </div>
                <div className="rounded-lg bg-white border border-indigo-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">유지보수</p>
                  <p className="mt-2 text-xl font-bold text-slate-600">{maintenanceCount.toLocaleString()}건</p>
                </div>
              </div>
            </div>

            {/* 핵심 메시지 */}
            {(() => {
              const total = (preventive?.count ?? 0) + (reactive?.count ?? 0);
              if (total === 0) return null;
              const rRatio = (reactive?.count ?? 0) / total;
              const pRatio = (preventive?.count ?? 0) / total;
              if (nonRepairCount / totalCount > 0.5) return (
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-5 py-4">
                  <p className="text-sm font-bold text-indigo-700">Non-Repair 증가 — 개선/투자 활동 증가</p>
                  <p className="text-xs text-indigo-600 mt-1">제작설치·개발작업·유지보수 비중이 높습니다. 설비 개선 활동과 정기 유지 활동의 투입 현황을 점검하세요.</p>
                </div>
              );
              if (rRatio > 0.6) return (
                <div className="rounded-lg bg-red-50 border border-red-200 px-5 py-4">
                  <p className="text-sm font-bold text-red-700">정지수리 증가 — 설비 신뢰성 저하</p>
                  <p className="text-xs text-red-600 mt-1">정지·가동 수리 비중이 높습니다. 계획 예방보전(PM) 활동을 강화하여 설비 신뢰성을 개선하세요.</p>
                </div>
              );
              if (pRatio > 0.6) return (
                <div className="rounded-lg bg-green-50 border border-green-200 px-5 py-4">
                  <p className="text-sm font-bold text-green-700">Preventive 중심 운영 — 안정적 관리 상태</p>
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
                  <CardTitle className="text-base">시설팀 작업시간 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <RepairTypePieChart data={data.byRepairType} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preventive vs Reactive vs Non-Repair</CardTitle>
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
                  <CardTitle className="text-base">설비별 작업유형 분포</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessStackedChart data={data.byEquipmentRepairType} />
                </CardContent>
              </Card>
            </div>

            {renderTopWorkSection(
              "정지수리 TOP 10",
              data.topRepairs,
              0,
              "border-red-100 bg-red-50",
              "bg-red-100 text-red-700"
            )}
            {renderTopWorkSection(
              "제작설치 TOP 10",
              data.fabricationInstallTopItems,
              1000,
              "border-indigo-100 bg-indigo-50",
              "bg-indigo-100 text-indigo-700"
            )}
            {renderTopWorkSection(
              "개발작업 TOP 10",
              data.developmentTopItems,
              2000,
              "border-purple-100 bg-purple-50",
              "bg-purple-100 text-purple-700"
            )}
            {renderTopWorkSection(
              "유지보수 TOP 10",
              data.maintenanceTopItems,
              3000,
              "border-slate-100 bg-slate-50",
              "bg-slate-200 text-slate-700"
            )}
          </>
        )}
      </div>
    </main>
  );
}
