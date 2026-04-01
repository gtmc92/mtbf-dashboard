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
