"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import type { Factory, MonthlyRecord } from "@/types";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface ProcessGroup {
  processId: number;
  processName: string;
  records: Record<number, MonthlyRecord>;
}

export default function StatusPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [processGroups, setProcessGroups] = useState<ProcessGroup[]>([]);
  const [factoryName, setFactoryName] = useState("");

  useEffect(() => {
    fetch("/api/factories")
      .then((r) => r.json())
      .then(setFactories);
  }, []);

  useEffect(() => {
    if (!selectedFactory || !selectedYear) return;
    fetch(`/api/records?factoryId=${selectedFactory}&year=${selectedYear}`)
      .then((r) => r.json())
      .then((records: MonthlyRecord[]) => {
        // 공정별로 그룹화
        const groupMap: Record<number, ProcessGroup> = {};
        records.forEach((rec) => {
          if (!groupMap[rec.processId]) {
            groupMap[rec.processId] = {
              processId: rec.processId,
              processName: rec.process?.name ?? "",
              records: {},
            };
          }
          groupMap[rec.processId].records[rec.month] = rec;
        });
        setProcessGroups(Object.values(groupMap));
      });

    const f = factories.find((f) => String(f.id) === selectedFactory);
    setFactoryName(f?.name ?? "");
  }, [selectedFactory, selectedYear, factories]);

  const fmt = (v: number | null | undefined, decimals = 1) => {
    if (v === null || v === undefined) return "-";
    return v.toFixed(decimals);
  };

  // 합계 계산
  const getTotal = (group: ProcessGroup) => {
    let totalOp = 0, totalStop = 0, totalStopTime = 0;
    MONTHS.forEach((m) => {
      const r = group.records[m];
      if (r) {
        totalOp += r.operatingTime ?? 0;
        totalStop += r.stopCount ?? 0;
        totalStopTime += r.stopTime ?? 0;
      }
    });
    const mtbf = totalStop > 0 ? totalOp / totalStop : null;
    const mttr = totalStop > 0 ? totalStopTime / totalStop : null;
    return { totalOp, totalStop, totalStopTime, mtbf, mttr };
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <h1 className="text-xl font-bold text-gray-900">현황 조회</h1>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-6">
        {/* 필터 */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">연도</label>
                <Select value={selectedYear} onValueChange={(v) => { if (v) setSelectedYear(v); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="연도" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* 현황 테이블 */}
        {processGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedYear}년 {factoryName} 설비 MTBF &amp; MTTR 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-400 text-white">
                    <th className="border border-gray-300 px-3 py-2 text-left">공정</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">항목</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="border border-gray-300 px-2 py-2 text-center min-w-[60px]">
                        {m}월
                      </th>
                    ))}
                    <th className="border border-gray-300 px-3 py-2 text-center bg-amber-500">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {processGroups.map((group) => {
                    const totals = getTotal(group);
                    return (
                      <>
                        {/* 가동시간 */}
                        <tr key={`${group.processId}-op`} className="bg-white">
                          <td rowSpan={5} className="border border-gray-300 px-3 py-2 font-medium text-gray-700 align-middle text-center">
                            {group.processName}
                          </td>
                          <td className="border border-gray-300 px-3 py-1 text-gray-600">가동시간</td>
                          {MONTHS.map((m) => (
                            <td key={m} className="border border-gray-300 px-2 py-1 text-center">
                              {fmt(group.records[m]?.operatingTime, 0)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                            {totals.totalOp.toLocaleString()}
                          </td>
                        </tr>
                        {/* 정지횟수 */}
                        <tr key={`${group.processId}-cnt`} className="bg-gray-50">
                          <td className="border border-gray-300 px-3 py-1 text-gray-600">정지횟수</td>
                          {MONTHS.map((m) => (
                            <td key={m} className="border border-gray-300 px-2 py-1 text-center">
                              {fmt(group.records[m]?.stopCount, 0)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                            {totals.totalStop}
                          </td>
                        </tr>
                        {/* 정지시간 */}
                        <tr key={`${group.processId}-st`} className="bg-white">
                          <td className="border border-gray-300 px-3 py-1 text-gray-600">정지시간</td>
                          {MONTHS.map((m) => (
                            <td key={m} className="border border-gray-300 px-2 py-1 text-center">
                              {fmt(group.records[m]?.stopTime, 0)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                            {totals.totalStopTime}
                          </td>
                        </tr>
                        {/* MTBF */}
                        <tr key={`${group.processId}-mtbf`} className="bg-amber-50">
                          <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">MTBF</td>
                          {MONTHS.map((m) => (
                            <td key={m} className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800">
                              {fmt(group.records[m]?.mtbf, 1)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1 text-center bg-amber-200 font-bold text-amber-900">
                            {fmt(totals.mtbf, 1)}
                          </td>
                        </tr>
                        {/* MTTR */}
                        <tr key={`${group.processId}-mttr`} className="bg-amber-50">
                          <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">MTTR</td>
                          {MONTHS.map((m) => (
                            <td key={m} className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800">
                              {fmt(group.records[m]?.mttr, 2)}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-1 text-center bg-amber-200 font-bold text-amber-900">
                            {fmt(totals.mttr, 2)}
                          </td>
                        </tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {!selectedFactory && (
          <div className="text-center text-gray-400 py-20">
            연도와 공장을 선택하면 현황 테이블이 표시됩니다.
          </div>
        )}
      </div>
    </main>
  );
}
