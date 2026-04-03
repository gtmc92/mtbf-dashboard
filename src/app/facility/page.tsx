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

interface FacilitySummary {
  years: number[];
  total: { incidentCount: number; totalDurationMin: number };
  byRepairType: RepairTypeStat[];
  byManagementType: ManagementTypeStat[];
  topEquipment: EquipmentStat[];
  byEquipmentRepairType: Record<string, unknown>[];
}

function fmtMin(min: number) {
  if (min >= 60) return `${(min / 60).toFixed(1)}h`;
  return `${Math.round(min)}분`;
}

export default function FacilityPage() {
  const [data, setData] = useState<FacilitySummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
                  <p className="text-xs text-gray-400 mt-1">{fmtMin(preventive?.durationMin ?? 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">Reactive</p>
                  <p className="text-2xl font-bold text-red-500">{reactive?.count.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtMin(reactive?.durationMin ?? 0)}</p>
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
          </>
        )}
      </div>
    </main>
  );
}
