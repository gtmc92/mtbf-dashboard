"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import type { Factory, MonthlyRecord } from "@/types";
import MtbfCompareChart from "@/components/charts/MtbfCompareChart";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CURRENT_YEAR = new Date().getFullYear();

interface YearData {
  [month: number]: { mtbf: number | null; mttr: number | null };
}

export default function ComparePage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [baseYear, setBaseYear] = useState<string>(String(CURRENT_YEAR - 1));
  const [compareYear, setCompareYear] = useState<string>(String(CURRENT_YEAR));
  const [baseData, setBaseData] = useState<YearData>({});
  const [compareData, setCompareData] = useState<YearData>({});
  const [factoryName, setFactoryName] = useState("");

  useEffect(() => {
    fetch("/api/factories")
      .then((r) => r.json())
      .then(setFactories);
  }, []);

  const loadYearData = async (year: string, factoryId: string): Promise<YearData> => {
    const res = await fetch(`/api/records?factoryId=${factoryId}&year=${year}`);
    const records: MonthlyRecord[] = await res.json();

    // 공장 합계: 각 월별로 전체 공정 MTBF/MTTR 집계
    const monthMap: Record<number, { totalOp: number; totalCnt: number; totalStopTime: number }> = {};
    MONTHS.forEach((m) => {
      monthMap[m] = { totalOp: 0, totalCnt: 0, totalStopTime: 0 };
    });

    records.forEach((rec) => {
      monthMap[rec.month].totalOp += rec.operatingTime ?? 0;
      monthMap[rec.month].totalCnt += rec.stopCount ?? 0;
      monthMap[rec.month].totalStopTime += rec.stopTime ?? 0;
    });

    const result: YearData = {};
    MONTHS.forEach((m) => {
      const { totalOp, totalCnt, totalStopTime } = monthMap[m];
      result[m] = {
        mtbf: totalCnt > 0 ? Math.round((totalOp / totalCnt) * 10) / 10 : null,
        mttr: totalCnt > 0 ? Math.round((totalStopTime / totalCnt) * 100) / 100 : null,
      };
    });
    return result;
  };

  useEffect(() => {
    if (!selectedFactory) return;
    const f = factories.find((f) => String(f.id) === selectedFactory);
    setFactoryName(f?.name ?? "");

    Promise.all([
      loadYearData(baseYear, selectedFactory),
      loadYearData(compareYear, selectedFactory),
    ]).then(([base, compare]) => {
      setBaseData(base);
      setCompareData(compare);
    });
  }, [selectedFactory, baseYear, compareYear, factories]);

  const fmt = (v: number | null | undefined, d = 1) => {
    if (v === null || v === undefined) return "-";
    return v.toFixed(d);
  };

  const chartData = MONTHS.map((m) => ({
    month: `${m}월`,
    [`${baseYear}년`]: baseData[m]?.mtbf ?? 0,
    [`${compareYear}년`]: compareData[m]?.mtbf ?? 0,
  }));

  const chartDataMttr = MONTHS.map((m) => ({
    month: `${m}월`,
    [`${baseYear}년`]: baseData[m]?.mttr ?? 0,
    [`${compareYear}년`]: compareData[m]?.mttr ?? 0,
  }));

  const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <h1 className="text-xl font-bold text-gray-900">연도 비교</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">공장</label>
                <Select value={selectedFactory} onValueChange={(v) => { if (v) setSelectedFactory(v); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="공장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">기준 연도</label>
                <Select value={baseYear} onValueChange={(v) => { if (v) setBaseYear(v); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center pb-2 text-gray-400 font-medium">vs</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">비교 연도</label>
                <Select value={compareYear} onValueChange={(v) => { if (v) setCompareYear(v); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedFactory && (
          <Tabs defaultValue="chart">
            <TabsList className="mb-4">
              <TabsTrigger value="chart">차트 비교</TabsTrigger>
              <TabsTrigger value="table">수치 요약표</TabsTrigger>
            </TabsList>

            {/* 차트 탭 */}
            <TabsContent value="chart">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {factoryName} {baseYear}년, {compareYear}년 MTBF 비교
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MtbfCompareChart
                      data={chartData}
                      baseYear={baseYear}
                      compareYear={compareYear}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {factoryName} {baseYear}년, {compareYear}년 MTTR 비교
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MtbfCompareChart
                      data={chartDataMttr}
                      baseYear={baseYear}
                      compareYear={compareYear}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 요약표 탭 */}
            <TabsContent value="table">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {factoryName} 설비 주요 공정 MTBF &amp; MTTR 현황
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-400 text-white">
                        <th className="border border-gray-300 px-3 py-2" colSpan={2}></th>
                        {MONTHS.map((m) => (
                          <th key={m} className="border border-gray-300 px-2 py-2 text-center min-w-[56px]">
                            {m}월
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td rowSpan={2} className="border border-gray-300 px-3 py-2 font-bold text-center align-middle">
                          MTBF<br />(고장간격)
                        </td>
                        <td className="border border-gray-300 px-3 py-1 text-center font-medium">{baseYear}년</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="border border-gray-300 px-2 py-1 text-center">
                            {fmt(baseData[m]?.mtbf)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-amber-50">
                        <td className="border border-gray-300 px-3 py-1 text-center font-medium text-amber-800">{compareYear}년</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="border border-gray-300 px-2 py-1 text-center text-amber-800">
                            {fmt(compareData[m]?.mtbf)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-white">
                        <td rowSpan={2} className="border border-gray-300 px-3 py-2 font-bold text-center align-middle">
                          MTTR<br />(수리복구)
                        </td>
                        <td className="border border-gray-300 px-3 py-1 text-center font-medium">{baseYear}년</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="border border-gray-300 px-2 py-1 text-center">
                            {fmt(baseData[m]?.mttr, 2)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-amber-50">
                        <td className="border border-gray-300 px-3 py-1 text-center font-medium text-amber-800">{compareYear}년</td>
                        {MONTHS.map((m) => (
                          <td key={m} className="border border-gray-300 px-2 py-1 text-center text-amber-800">
                            {fmt(compareData[m]?.mttr, 2)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedFactory && (
          <div className="text-center text-gray-400 py-20">
            공장을 선택하면 연도별 비교 차트와 요약표가 표시됩니다.
          </div>
        )}
      </div>
    </main>
  );
}
