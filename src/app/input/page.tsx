"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Factory, Process } from "@/types";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CURRENT_YEAR = new Date().getFullYear();


interface MonthInput {
  operatingTime: string;
  stopCount: string;
  stopTime: string;
}

type MonthData = Record<number, MonthInput>;

export default function InputPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [selectedFactory, setSelectedFactory] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [monthData, setMonthData] = useState<MonthData>({});
  const [saving, setSaving] = useState(false);
  const [savedMonths, setSavedMonths] = useState<number[]>([]);

  // 연도 목록 로드 (DB 기반)
  useEffect(() => {
    fetch("/api/years")
      .then((r) => r.json())
      .then((data: number[]) => {
        if (data.length > 0) setYears(data);
      });
  }, []);

  // 공장 목록 로드
  useEffect(() => {
    fetch("/api/factories")
      .then((r) => r.json())
      .then(setFactories);
  }, []);

  // 공정 목록 로드 (공장 선택 시)
  useEffect(() => {
    if (!selectedFactory) return;
    fetch(`/api/processes?factoryId=${selectedFactory}`)
      .then((r) => r.json())
      .then(setProcesses);
    setSelectedProcess("");
  }, [selectedFactory]);

  // 기존 데이터 로드 (공정+연도 선택 시)
  useEffect(() => {
    if (!selectedProcess || !selectedYear) return;
    fetch(`/api/records?processId=${selectedProcess}&year=${selectedYear}`)
      .then((r) => r.json())
      .then((records) => {
        const data: MonthData = {};
        records.forEach((rec: any) => {
          data[rec.month] = {
            operatingTime: rec.operatingTime ?? "",
            stopCount: rec.stopCount ?? "",
            stopTime: rec.stopTime ?? "",
          };
        });
        setMonthData(data);
      });
  }, [selectedProcess, selectedYear]);

  const handleChange = (month: number, field: keyof MonthInput, value: string) => {
    setMonthData((prev) => ({
      ...prev,
      [month]: { ...prev[month], [field]: value },
    }));
  };

  const handleSave = async (month: number) => {
    const d = monthData[month];
    if (!d) return;
    setSaving(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId: selectedProcess,
          year: selectedYear,
          month,
          operatingTime: d.operatingTime || null,
          stopCount: d.stopCount || null,
          stopTime: d.stopTime || null,
        }),
      });
      if (res.ok) {
        setSavedMonths((prev) => [...new Set([...prev, month])]);
        setTimeout(() => setSavedMonths((prev) => prev.filter((m) => m !== month)), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = Number(selectedYear) < CURRENT_YEAR;

  // MTBF/MTTR 미리보기 계산
  const calcMTBF = (d: MonthInput) => {
    const op = Number(d?.operatingTime);
    const cnt = Number(d?.stopCount);
    if (!op || !cnt) return "-";
    return (op / cnt / 60).toFixed(1);
  };
  const calcMTTR = (d: MonthInput) => {
    const st = Number(d?.stopTime);
    const cnt = Number(d?.stopCount);
    if (!st || !cnt) return "-";
    return (st / cnt / 60).toFixed(2);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 홈</Link>
          <h1 className="text-xl font-bold text-gray-900">데이터 입력</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 선택 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">입력 대상 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">연도</label>
                <Select value={selectedYear} onValueChange={(v) => { if (v) setSelectedYear(v); }}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="연도" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">공장</label>
                <Select value={selectedFactory} onValueChange={(v) => { if (v) setSelectedFactory(v); }}>
                  <SelectTrigger className="w-28">
                    <span className={selectedFactory ? "" : "text-muted-foreground"}>
                      {selectedFactory
                        ? (factories.find((f) => String(f.id) === selectedFactory)?.name ?? selectedFactory)
                        : "공장 선택"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {factories.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">공정</label>
                <Select
                  value={selectedProcess}
                  onValueChange={(v) => { if (v) setSelectedProcess(v); }}
                  disabled={!selectedFactory}
                >
                  <SelectTrigger className="w-36">
                    <span className={selectedProcess ? "" : "text-muted-foreground"}>
                      {selectedProcess
                        ? (processes.find((p) => String(p.id) === selectedProcess)?.name ?? selectedProcess)
                        : "공정 선택"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {processes.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 읽기 전용 안내 배너 */}
        {selectedProcess && isReadOnly && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            과거 연도 데이터는 조회만 가능합니다. 수정은 {CURRENT_YEAR}년 데이터만 가능합니다.
          </div>
        )}

        {/* 월별 입력 테이블 */}
        {selectedProcess && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedYear}년 월별 데이터 입력
                {isReadOnly && <span className="ml-2 text-xs font-normal text-amber-600">(읽기 전용)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-amber-400 text-white">
                    <th className="border border-gray-300 px-3 py-2 text-left">항목</th>
                    {MONTHS.map((m) => (
                      <th key={m} className="border border-gray-300 px-2 py-2 text-center min-w-[90px]">
                        {m}월
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* 가동시간 */}
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-3 py-1 font-medium text-gray-700 whitespace-nowrap">
                      가동시간(분)
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-1 py-1">
                        <Input
                          type="number"
                          className="h-7 text-xs text-center"
                          value={monthData[m]?.operatingTime ?? ""}
                          onChange={(e) => handleChange(m, "operatingTime", e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                  {/* 정지횟수 */}
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-3 py-1 font-medium text-gray-700 whitespace-nowrap">
                      정지횟수
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-1 py-1">
                        <Input
                          type="number"
                          className="h-7 text-xs text-center"
                          value={monthData[m]?.stopCount ?? ""}
                          onChange={(e) => handleChange(m, "stopCount", e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                  {/* 정지시간 */}
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-3 py-1 font-medium text-gray-700 whitespace-nowrap">
                      정지시간(분)
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-1 py-1">
                        <Input
                          type="number"
                          className="h-7 text-xs text-center"
                          value={monthData[m]?.stopTime ?? ""}
                          onChange={(e) => handleChange(m, "stopTime", e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                  {/* MTBF 미리보기 */}
                  <tr className="bg-amber-50">
                    <td className="border border-gray-300 px-3 py-1 font-bold text-amber-700 whitespace-nowrap">
                      MTBF(h)
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-2 py-1 text-center text-xs text-amber-700 font-medium">
                        {monthData[m] ? calcMTBF(monthData[m]) : "-"}
                      </td>
                    ))}
                  </tr>
                  {/* MTTR 미리보기 */}
                  <tr className="bg-amber-50">
                    <td className="border border-gray-300 px-3 py-1 font-bold text-amber-700 whitespace-nowrap">
                      MTTR(h)
                    </td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-2 py-1 text-center text-xs text-amber-700 font-medium">
                        {monthData[m] ? calcMTTR(monthData[m]) : "-"}
                      </td>
                    ))}
                  </tr>
                  {/* 저장 버튼 */}
                  <tr>
                    <td className="border border-gray-300 px-3 py-1 text-gray-500 text-xs">저장</td>
                    {MONTHS.map((m) => (
                      <td key={m} className="border border-gray-300 px-1 py-1 text-center">
                        <Button
                          size="sm"
                          variant={savedMonths.includes(m) ? "default" : "outline"}
                          className="h-7 text-xs w-full"
                          onClick={() => handleSave(m)}
                          disabled={saving || isReadOnly}
                        >
                          {savedMonths.includes(m) ? "✓" : "저장"}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {!selectedProcess && (
          <div className="text-center text-gray-400 py-20">
            연도, 공장, 공정을 선택하면 입력 테이블이 표시됩니다.
          </div>
        )}
      </div>
    </main>
  );
}
