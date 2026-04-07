"use client";

import React, { useEffect, useState } from "react";
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
  mtbf: number | null;
  mttr: number | null;
  stopCount: number;
  stopTime: number;
  operatingTime: number;
}

export default function StatusPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [rollingRecords, setRollingRecords] = useState<MonthlyRecord[]>([]);
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
      setRollingRecords([]);
      return;
    }
    setLoading(true);
    const procParam = selectedProcess !== "all" ? `&processId=${selectedProcess}` : "";
    const ytdUrl = `/api/records?factoryId=${selectedFactory}&year=${selectedYear}${procParam}`;
    const rollingUrl = `/api/records?factoryId=${selectedFactory}${procParam}`;
    Promise.all([
      fetch(ytdUrl).then((r) => r.json()),
      fetch(rollingUrl).then((r) => r.json()),
    ])
      .then(([ytdData, rollingData]: [MonthlyRecord[], MonthlyRecord[]]) => {
        setRecords(ytdData);
        setRollingRecords(rollingData);
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
      mtbf: totalCnt > 0 ? totalOp / totalCnt / 60 : null,
      mttr: totalCnt > 0 ? totalStop / totalCnt / 60 : null,
      stopCount: totalCnt,
      stopTime: totalStop,
      operatingTime: totalOp,
    };
  });

  // KPI 계산 (연도 누적: Σ가동시간 / Σ정지횟수)
  const ytdTotalOp = records.reduce((s, r) => s + (r.operatingTime ?? 0), 0);
  const ytdStopCount = records.reduce((s, r) => s + (r.stopCount ?? 0), 0);
  const ytdStopTime = records.reduce((s, r) => s + (r.stopTime ?? 0), 0);
  const ytdMtbf = ytdStopCount > 0 ? ytdTotalOp / ytdStopCount / 60 : null;
  const ytdMttr = ytdStopCount > 0 ? ytdStopTime / ytdStopCount / 60 : null;

  // KPI 계산 (연속 누적: 전체 연도 합산)
  const rollingTotalOp   = rollingRecords.reduce((s, r) => s + (r.operatingTime ?? 0), 0);
  const rollingStopCount = rollingRecords.reduce((s, r) => s + (r.stopCount ?? 0), 0);
  const rollingStopTime  = rollingRecords.reduce((s, r) => s + (r.stopTime ?? 0), 0);
  const rollingMtbf = rollingStopCount > 0 ? rollingTotalOp / rollingStopCount / 60 : null;
  const rollingMttr = rollingStopCount > 0 ? rollingStopTime / rollingStopCount / 60 : null;

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

  const fmtH = (v: number | null | undefined, decimals = 1) => {
    if (v === null || v === undefined) return "-";
    return (v / 60).toFixed(decimals);
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
    const mtbf = totalStop > 0 ? totalOp / totalStop / 60 : null;
    const mttr = totalStop > 0 ? totalStopTime / totalStop / 60 : null;
    return { totalOp, totalStop, totalStopTime, mtbf, mttr };
  };

  const getRollingTotal = (processId: number) => {
    const recs = rollingRecords.filter((r) => r.processId === processId);
    const op   = recs.reduce((s, r) => s + (r.operatingTime ?? 0), 0);
    const cnt  = recs.reduce((s, r) => s + (r.stopCount ?? 0), 0);
    const stop = recs.reduce((s, r) => s + (r.stopTime ?? 0), 0);
    return {
      totalOp: op, totalStop: cnt, totalStopTime: stop,
      mtbf: cnt > 0 ? op / cnt / 60 : null,
      mttr: cnt > 0 ? stop / cnt / 60 : null,
    };
  };

  const selectedProcessName =
    selectedProcess === "all"
      ? "전체"
      : processes.find((p) => String(p.id) === selectedProcess)?.name ?? "";

  const hasData = records.length > 0;

  // 상태 메시지: 조건 분기
  const statusConfig = (() => {
    if (ytdStopCount === 0) return {
      icon: "✅", msg: "무고장 운영 중",
      border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-800",
    };
    if (ytdStopCount < 3) return {
      icon: "⚠️", msg: "해석 주의 — 정지 건수가 적어 MTBF/MTTR 평균값의 신뢰도가 낮습니다",
      border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800",
    };
    return {
      icon: "⚠️", msg: "고장 발생으로 MTBF 산출",
      border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800",
    };
  })();

  // 연속 무고장 개월 수 + 누적 가동시간 계산
  const noFailureStreak = (() => {
    let streak = 0;
    let lastFailureMonth: string | null = null;
    let cumulativeOpMin = 0;
    for (let i = MONTHS.length - 1; i >= 0; i--) {
      const m = MONTHS[i];
      const hasData = records.some((r) => r.month === m);
      if (!hasData) continue;
      const d = monthlyData[i];
      if (d.stopCount === 0) {
        streak++;
        cumulativeOpMin += d.operatingTime;
      } else {
        lastFailureMonth = d.month;
        break;
      }
    }
    return {
      streak,
      lastFailureMonth,
      cumulativeOpHours: Math.round((cumulativeOpMin / 60) * 10) / 10,
    };
  })();

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
                    <span className={selectedFactory ? "" : "text-muted-foreground"}>
                      {selectedFactory
                        ? (factories.find((f) => String(f.id) === selectedFactory)?.name ?? selectedFactory)
                        : "공장 선택"}
                    </span>
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
                    <span className={selectedProcess && selectedProcess !== "all" ? "" : "text-muted-foreground"}>
                      {selectedProcess === "all"
                        ? "전체"
                        : selectedProcess
                          ? (processes.find((p) => String(p.id) === selectedProcess)?.name ?? selectedProcess)
                          : "공정 선택"}
                    </span>
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
            {/* KPI 카드 — 연도 누적 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">연도누적 MTBF</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ytdMtbf !== null ? ytdMtbf.toFixed(1) : "-"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">h · {selectedYear}년 누적</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">연도누적 MTTR</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {ytdMttr !== null ? ytdMttr.toFixed(2) : "-"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    h · 총 {ytdStopCount}건 기준
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 정지횟수</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {ytdStopCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">회</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-gray-500 mb-1">총 정지시간</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {(ytdStopTime / 60).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">h (총 정지)</p>
                </CardContent>
              </Card>
            </div>

            {/* KPI 카드 — 연속 누적 */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-4">
              <p className="text-xs font-semibold text-indigo-600 mb-3">전체 기간 연속 누적</p>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500 mb-1">연속누적 MTBF</p>
                    <p className="text-2xl font-bold text-indigo-700">
                      {rollingMtbf !== null ? rollingMtbf.toFixed(1) : "-"}
                    </p>
                    <p className="text-xs text-indigo-400 mt-1">h · 전체 기간 연속 누적</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-gray-500 mb-1">연속누적 MTTR</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {rollingMttr !== null ? rollingMttr.toFixed(2) : "-"}
                    </p>
                    <p className="text-xs text-rose-400 mt-1">h · 총 {rollingStopCount}건 기준</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 상태 메시지 (조건 분기) */}
            <div className={`flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${statusConfig.border} ${statusConfig.bg} ${statusConfig.text}`}>
              <span>{statusConfig.icon}</span>
              <span>{statusConfig.msg}</span>
            </div>

            {/* 연속 무고장 KPI 카드 */}
            {noFailureStreak.streak > 0 && (
              <div className="rounded-lg bg-teal-50 border border-teal-200 px-5 py-4">
                <p className="text-sm font-bold text-teal-700 mb-3">✅ 연속 무고장 운영</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-teal-600 mb-1">연속 무고장</p>
                    <p className="text-xl font-bold text-teal-700">
                      {noFailureStreak.streak}
                      <span className="text-sm font-normal ml-1">개월</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 mb-1">최근 고장 이후 경과</p>
                    <p className="text-xl font-bold text-teal-700">
                      {noFailureStreak.streak}
                      <span className="text-sm font-normal ml-1">개월</span>
                    </p>
                    {noFailureStreak.lastFailureMonth && (
                      <p className="text-xs text-teal-500 mt-0.5">{noFailureStreak.lastFailureMonth} 이후</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 mb-1">누적 가동시간</p>
                    <p className="text-xl font-bold text-teal-700">
                      {noFailureStreak.cumulativeOpHours.toLocaleString()}
                      <span className="text-sm font-normal ml-1">h</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* KPI 해석 가이드 */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-700 mb-2">📖 KPI 해석 가이드</p>
              <p><span className="font-medium text-blue-600">MTBF</span>: 고장 간 평균 가동시간 — 값이 클수록 설비 신뢰성 높음</p>
              <p><span className="font-medium text-orange-500">MTTR</span>: 고장 건당 평균 수리시간 — 값이 작을수록 복구 빠름 (총 정지횟수 기준)</p>
              <p className="text-gray-400">※ 정지횟수 0인 달은 MTBF/MTTR 산출에서 제외됩니다 (고장 없는 기간은 별도 누적 가동시간으로 확인)</p>
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
                        formatter={(v) =>
                          v == null
                            ? ["무고장 운영 / 산출 불가", "MTBF"]
                            : [`${Number(v).toFixed(1)} h`, "MTBF"]
                        }
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
                        formatter={(v) =>
                          v == null
                            ? ["무고장 운영 / 산출 불가", "MTTR"]
                            : [`${Number(v).toFixed(2)} h`, "MTTR"]
                        }
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
                        연도누적
                      </th>
                      <th className="border border-gray-300 px-3 py-2 text-center bg-indigo-500 text-white">
                        연속누적
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {processGroups.map((group) => {
                      const totals = getTotal(group);
                      const rolling = getRollingTotal(group.processId);
                      return (
                        <React.Fragment key={group.processId}>
                          <tr className="bg-white">
                            <td
                              rowSpan={5}
                              className="border border-gray-300 px-3 py-2 font-medium text-gray-700 align-middle text-center"
                            >
                              {group.processName}
                            </td>
                            <td className="border border-gray-300 px-3 py-1 text-gray-600">
                              가동시간(분)
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
                            <td className="border border-gray-300 px-2 py-1 text-center bg-indigo-50 font-medium">
                              {rolling.totalOp.toLocaleString()}
                            </td>
                          </tr>
                          <tr className="bg-gray-50">
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
                            <td className="border border-gray-300 px-2 py-1 text-center bg-indigo-50 font-medium">
                              {rolling.totalStop}
                            </td>
                          </tr>
                          <tr className="bg-white">
                            <td className="border border-gray-300 px-3 py-1 text-gray-600">
                              정지시간(분)
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
                            <td className="border border-gray-300 px-2 py-1 text-center bg-indigo-50 font-medium">
                              {rolling.totalStopTime}
                            </td>
                          </tr>
                          <tr className="bg-amber-50">
                            <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">
                              MTBF(h) · 월별
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800"
                              >
                                {(() => {
                                  const rec = group.records[m];
                                  if (!rec?.stopCount || rec.stopCount === 0) return "-";
                                  return ((rec.operatingTime ?? 0) / rec.stopCount / 60).toFixed(1);
                                })()}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-amber-200 font-bold text-amber-900">
                              {fmt(totals.mtbf, 1)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center bg-indigo-200 font-bold text-indigo-900">
                              {fmt(rolling.mtbf, 1)}
                            </td>
                          </tr>
                          <tr className="bg-amber-50">
                            <td className="border border-gray-300 px-3 py-1 font-bold text-amber-800">
                              MTTR(h) · 월별
                            </td>
                            {MONTHS.map((m) => (
                              <td
                                key={m}
                                className="border border-gray-300 px-2 py-1 text-center font-medium text-amber-800"
                              >
                                {(() => {
                                  const rec = group.records[m];
                                  if (!rec?.stopCount || rec.stopCount === 0) return "-";
                                  return ((rec.stopTime ?? 0) / rec.stopCount / 60).toFixed(2);
                                })()}
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center bg-amber-200 font-bold text-amber-900">
                              {fmt(totals.mttr, 2)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center bg-indigo-200 font-bold text-indigo-900">
                              {fmt(rolling.mttr, 2)}
                            </td>
                          </tr>
                        </React.Fragment>
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
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-lg font-semibold text-gray-500">데이터 없음</p>
            <p className="text-sm text-gray-400">해당 연도/공정 데이터가 입력되지 않았습니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}
