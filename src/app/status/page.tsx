"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import type { Factory, MonthlyRecord, Process } from "@/types";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface ProcessGroup {
  processId: number;
  processName: string;
  records: Record<number, MonthlyRecord>;
}

interface MonthlyChartData {
  month: string;
  mtbf: number;
  mttr: number;
  stopCount: number;
  stopTime: number;
}

export default function StatusPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [factoryName, setFactoryName] = useState("");

  // 연도 목록 초기 로드 (DB 기준)
  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data: number[]) => {
        setYears(data);
        if (data.length > 0) {
          setSelectedYear((prev) =>
            data.includes(Number(prev)) ? prev : String(data[data.length - 1])
          );
        }
      });
  }, []);

  // 공장 목록 초기 로드
  useEffect(() => {
    fetch("/api/factories")
      .then((r) => r.json())
      .then(setFactories);
  }, []);

  // 공장 변경 시 공정 목록 로드
  useEffect(() => {
    if (!selectedFactory) {
      setProcesses([]);
      setSelectedProcess("all");
      return;
    }
    const f = factories.find((f) => String(f.id) === selectedFactory);
    setFactoryName(f?.name ?? "");
    setSelectedProcess("all");
    fetch(`/api/processes?factoryId=${selectedFactory}`)
      .then((r) => r.json())
      .then(setProcesses);
  }, [selectedFactory, factories]);

  // 필터 변경 시 레코드 로드
  useEffect(() => {
    if (!selectedFactory) {
      setRecords([]);
      return;
    }
    setLoading(true);
    let url = `/api/records?factoryId=${selectedFactory}&year=${selectedYear}`;
    if (selectedProcess !== "all") {
      url += `&processId=${selectedProcess}`;
    }
    fetch(url)
      .then((r) => r.json())
      .then((data: MonthlyRecord[]) => {
        setRecords(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedFactory, selectedYear, selectedProcess]);

  // 월별 집계 데이터 (1~12월 고정, 없는 달 0)
  const monthlyData: MonthlyChartData[] = MONTHS.map((m) => {
    const monthRecords = records.filter((r) => r.month === m);
    const totalOp = monthRecords.reduce((s, r) => s + (r.operatingTime ?? 0), 0);
    const totalCnt = monthRecords.reduce((s, r) => s + (r.stopCount ?? 0), 0);
    const totalStop = monthRecords.reduce((s, r) => s + (r.stopTime ?? 0), 0);
    return {
      month: `${m}월`,
      mtbf: totalCnt > 0 ? totalOp / totalCnt : 0,
      mttr: totalCnt > 0 ? totalStop / totalCnt : 0,
      stopCount: totalCnt,
      stopTime: totalStop,
    };
  });

  // KPI 계산
  const mtbfValues = monthlyData.filter((d) => d.mtbf > 0).map((d) => d.mtbf);
  const mttrValues = monthlyData.filter((d) => d.mttr > 0).map((d) => d.mttr);
  const avgMtbf =
    mtbfValues.length > 0
      ? mtbfValues.reduce((s, v) => s + v, 0) / mtbfValues.length
      : null;
  const avgMttr =
    mttrValues.length > 0
      ? mttrValues.reduce((s, v) => s + v, 0) / mttrValues.length
      : null;
  const totalStopCount = monthlyData.reduce((s, d) => s + d.stopCount, 0);
  const totalStopTime = monthlyData.reduce((s, d) => s + d.stopTime, 0);

  // 테이블용 공정 그룹화
  const processGroups: ProcessGroup[] = (() => {
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
    return Object.values(groupMap);
  })();

  const fmt = (v: number | null | undefined, decimals = 1) => {
    if (v === null || v === undefined) return "-";
    return v.toFixed(decimals);
  };

  const getTotal = (group: ProcessGroup) => {
    let totalOp = 0,
      totalStop = 0,
      totalStopTime = 0;
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

  const selectedProcessName =
    selectedProcess === "all"
      ? "전체"
      : processes.find((p) => String(p.id) === selectedProcess)?.name ?? "";

  const hasData = records.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← 홈
          </Link>
          <h1 className="text-xl font-bold text-gray-900">현황 조회</h1>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-6 space-y-6">
        {/* 필터 */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">연도</label>
                <Select
                  value={selectedYear}
                  onValueChange={(v) => {
                    if (v) setSelectedYear(v);
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="연도" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">공장</label>
                <Select
                  value={selectedFactory}
                  onValueChange={(v) => {
                    if (v) setSelectedFactory(v);
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="공장 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">공정</label>
                <Select
                  value={selectedProcess}
                  onValueChange={(v) => {
                    if (v) setSelectedProcess(v);
                  }}
                  disabled={!selectedFactory}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="공정 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 미선택 안내 */}
        {!selectedFactory && (
          <div className="text-center text-gray-400 py-20">
            연도와 공장을 선택하면 현황이 표시됩니다.
          </div>
        )}

        {/* 로딩 */}
        {selectedFactory && loading && (
          <div className="text-center text-gray-400 py-20">
            <div className="inline-block w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-sm">데이터 불러오는 중...</p>
          </div>
        )}

        {/* 데이터 영역 */}
        {selectedFactory && !loading && hasData && (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">평균 MTBF</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {avgMtbf !== null ? avgMtbf.toFixed(1) : "-"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">분 (고장 간격)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">평균 MTTR</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {avgMttr !== null ? avgMttr.toFixed(2) : "-"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">분 (수리 복구)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 정지횟수</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {totalStopCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">회</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 정지시간</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {totalStopTime.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">분</p>
                </CardContent>
              </Card>
            </div>

            {/* 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {selectedYear}년 {factoryName} {selectedProcessName} — MTBF 월별 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => [
                          `${Number(v).toFixed(1)} 분`,
                          "MTBF",
                        ]}
                      />
                      <Bar dataKey="mtbf" fill="#4f81bd" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {selectedYear}년 {factoryName} {selectedProcessName} — MTTR 월별 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => [
                          `${Number(v).toFixed(2)} 분`,
                          "MTTR",
                        ]}
                      />
                      <Bar dataKey="mttr" fill="#f79646" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* 현황 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedYear}년 {factoryName} {selectedProcessName} 설비 MTBF &amp; MTTR 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-400 text-white">
                      <th className="border border-gray-300 px-3 py-2 text-left">
                        공정
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-left">
                        항목
                      </th>
                      {MONTHS.map((m) => (
                        <th
                          key={m}
                          className="border border-gray-300 px-2 py-2 text-center min-w-[60px]"
                        >
                          {m}월
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 text-center bg-amber-500">
                        합계
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {processGroups.map((group) => {
                      const totals = getTotal(group);
                      return (
                        <>
                          <tr key={`${group.processId}-op`} className="bg-white">
                            <td
                              rowSpan={5}
                              className="border border-gray-300 px-3 py-2 font-medium text-gray-700 align-middle text-center"
                            >
                              {group.processName}
                            </td>
                            <td className="border border-gray-300 px-3 py-1 text-gray-600">
                              가동시간
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center"
                              >
                                {fmt(group.records[m]?.operatingTime, 0)}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                              {totals.totalOp.toLocaleString()}
                            </td>
                          </tr>
                          <tr key={`${group.processId}-cnt`} className="bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1 text-gray-600">
                              정지횟수
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center"
                              >
                                {fmt(group.records[m]?.stopCount, 0)}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                              {totals.totalStop}
                            </td>
                          </tr>
                          <tr key={`${group.processId}-st`} className="bg-white">
                            <td className="border border-gray-300 px-3 py-1 text-gray-600">
                              정지시간
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center"
                              >
                                {fmt(group.records[m]?.stopTime, 0)}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-yellow-50 font-medium">
                              {totals.totalStopTime}
                            </td>
                          </tr>
                          <tr key={`${group.processId}-mtbf`} className="bg-amber-50">
                            <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">
                              MTBF
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800"
                              >
                                {fmt(group.records[m]?.mtbf, 1)}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-amber-200 font-bold text-amber-900">
                              {fmt(totals.mtbf, 1)}
                            </td>
                          </tr>
                          <tr key={`${group.processId}-mttr`} className="bg-amber-50">
                            <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">
                              MTTR
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800"
                              >
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
          </>
        )}

        {/* 데이터 없음 */}
        {selectedFactory && !loading && !hasData && (
          <div className="text-center text-gray-400 py-20">
            선택한 조건에 해당하는 데이터가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}
