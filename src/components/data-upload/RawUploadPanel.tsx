"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PreviewRowData {
  year: number;
  month: number;
  day: number;
  quarter: string | null;
  equipment: string;
  subEquipment: string | null;
  repairType: string | null;
  managementType: string | null;
  count: number | null;
  durationMin: number | null;
  repairTime: number | null;
  description: string | null;
}

interface PreviewRow {
  rowIndex: number;
  data: PreviewRowData | null;
  errors: string[];
  warnings: string[];
}

interface UploadResponse {
  batchId?: number;
  fileName?: string;
  rowCount?: number;
  errorCount?: number;
  warningCount?: number;
  canApply?: boolean;
  detectedPeriod?: {
    periodStartYear: number | null;
    periodStartMonth: number | null;
    periodEndYear: number | null;
    periodEndMonth: number | null;
  };
  preview?: PreviewRow[];
  fileErrors?: string[];
}

interface HistoryItem {
  id: number;
  fileName: string;
  applyMode: string;
  status: string;
  periodStartYear: number | null;
  periodStartMonth: number | null;
  periodEndYear: number | null;
  periodEndMonth: number | null;
  rowCount: number;
  errorCount: number;
  warningCount: number;
  uploadedAt: string;
  appliedAt: string | null;
  revertedAt: string | null;
}

const APPLY_MODES: { value: string; label: string }[] = [
  { value: "REPLACE_PERIOD", label: "지정 기간 교체" },
  { value: "REPLACE_ALL", label: "전체 교체" },
  { value: "APPEND", label: "추가만 하기" },
];

function periodLabel(item: {
  periodStartYear: number | null;
  periodStartMonth: number | null;
  periodEndYear: number | null;
  periodEndMonth: number | null;
}): string {
  if (item.periodStartYear == null || item.periodEndYear == null) return "-";
  const start = `${item.periodStartYear}-${String(item.periodStartMonth ?? 1).padStart(2, "0")}`;
  const end = `${item.periodEndYear}-${String(item.periodEndMonth ?? 12).padStart(2, "0")}`;
  return start === end ? start : `${start} ~ ${end}`;
}

function statusBadge(errors: string[], warnings: string[]) {
  if (errors.length > 0) return <Badge variant="destructive">ERROR</Badge>;
  if (warnings.length > 0) return <Badge variant="outline">WARN</Badge>;
  return <Badge variant="secondary">OK</Badge>;
}

function historyStatusBadge(status: string) {
  if (status === "APPLIED") return <Badge variant="secondary">적용됨</Badge>;
  if (status === "REVERTED") return <Badge variant="outline">되돌림</Badge>;
  if (status === "FAILED") return <Badge variant="destructive">실패</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function RawUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string[] | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [applyMode, setApplyMode] = useState<string>("REPLACE_PERIOD");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [revertingId, setRevertingId] = useState<number | null>(null);

  const loadHistory = useCallback(() => {
    fetch("/api/data/uploads")
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setResult(null);
    setUploadError(null);
    setApplyMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setResult(null);
    setApplyMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/data/upload/raw", { method: "POST", body: formData });
      const data: UploadResponse = await res.json();
      if (!res.ok) {
        setUploadError(data.fileErrors ?? ["업로드 처리 중 오류가 발생했습니다"]);
        return;
      }
      setResult(data);
    } catch {
      setUploadError(["업로드 요청에 실패했습니다"]);
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    if (!result?.batchId) return;
    setApplying(true);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/data/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: result.batchId, applyMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplyMessage(`적용 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      setApplyMessage(
        `적용 완료: ${data.appliedCount}건 반영 (기존 ${data.deletedCount}건 교체), 기간 ${periodLabel({
          periodStartYear: data.period.periodStartYear,
          periodStartMonth: data.period.periodStartMonth,
          periodEndYear: data.period.periodEndYear,
          periodEndMonth: data.period.periodEndMonth,
        })}`
      );
      setResult(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadHistory();
    } catch {
      setApplyMessage("적용 요청에 실패했습니다");
    } finally {
      setApplying(false);
    }
  };

  const handleRevert = async (id: number) => {
    setRevertingId(id);
    try {
      const res = await fetch(`/api/data/uploads/${id}/revert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setApplyMessage(`되돌리기 실패: ${data.error ?? "알 수 없는 오류"}`);
        return;
      }
      setApplyMessage(`배치 #${id} 되돌리기 완료`);
      loadHistory();
    } catch {
      setApplyMessage("되돌리기 요청에 실패했습니다");
    } finally {
      setRevertingId(null);
    }
  };

  const issueRows = result?.preview?.filter((r) => r.errors.length > 0 || r.warnings.length > 0) ?? [];

  return (
    <div className="space-y-6">
      {/* 원본 양식 다운로드 + 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">원본 파일 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <a href="/api/data/template/raw" download>
              <Button type="button" variant="outline" size="sm">
                원본 양식 다운로드 (.csv)
              </Button>
            </a>
            <span className="text-xs text-gray-400">
              일일작업일보 원본을 이 양식에 맞춰 작성하거나, 컬럼명이 다르더라도 자동으로 매핑을 시도합니다.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              className="text-sm"
            />
            <Button type="button" size="sm" onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? "업로드 중..." : "업로드 및 미리보기"}
            </Button>
          </div>

          {uploadError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold mb-1">ERROR</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {uploadError.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 검증 결과 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">검증 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>전체 <strong>{result.rowCount}</strong>행</span>
              <span className="text-red-600">에러 <strong>{result.errorCount}</strong>건</span>
              <span className="text-amber-600">경고 <strong>{result.warningCount}</strong>건</span>
              <span>감지된 기간: <strong>{periodLabel(result.detectedPeriod ?? {
                periodStartYear: null, periodStartMonth: null, periodEndYear: null, periodEndMonth: null,
              })}</strong></span>
            </div>

            {issueRows.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">행</th>
                      <th className="px-2 py-1 text-left">상태</th>
                      <th className="px-2 py-1 text-left">내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueRows.map((r) => (
                      <tr key={r.rowIndex} className="border-t">
                        <td className="px-2 py-1">{r.rowIndex}</td>
                        <td className="px-2 py-1">{statusBadge(r.errors, r.warnings)}</td>
                        <td className="px-2 py-1">
                          {[...r.errors, ...r.warnings].join(" / ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {issueRows.length === 0 && (
              <div className="text-sm text-green-700">OK - 모든 행이 검증을 통과했습니다.</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 미리보기 테이블 */}
      {result && result.preview && result.preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">변환 미리보기 (DATA_BASE 구조)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>년도</TableHead>
                  <TableHead>월</TableHead>
                  <TableHead>일</TableHead>
                  <TableHead>대표설비</TableHead>
                  <TableHead>구성설비</TableHead>
                  <TableHead>수리유형</TableHead>
                  <TableHead>관리구분</TableHead>
                  <TableHead>건수</TableHead>
                  <TableHead>시간(분)</TableHead>
                  <TableHead>수리시간</TableHead>
                  <TableHead>분기</TableHead>
                  <TableHead>사고 처리 내용</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.preview.map((r) => (
                  <TableRow key={r.rowIndex}>
                    <TableCell>{statusBadge(r.errors, r.warnings)}</TableCell>
                    <TableCell>{r.data?.year ?? "-"}</TableCell>
                    <TableCell>{r.data?.month ?? "-"}</TableCell>
                    <TableCell>{r.data?.day ?? "-"}</TableCell>
                    <TableCell>{r.data?.equipment || "-"}</TableCell>
                    <TableCell>{r.data?.subEquipment || "-"}</TableCell>
                    <TableCell>{r.data?.repairType || "-"}</TableCell>
                    <TableCell>{r.data?.managementType || "미분류"}</TableCell>
                    <TableCell>{r.data?.count ?? "-"}</TableCell>
                    <TableCell>{r.data?.durationMin ?? "-"}</TableCell>
                    <TableCell>{r.data?.repairTime ?? "-"}</TableCell>
                    <TableCell>{r.data?.quarter ?? "-"}</TableCell>
                    <TableCell className="max-w-64 truncate">{r.data?.description || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 적용 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">적용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-gray-500">적용 방식</label>
              <Select value={applyMode} onValueChange={(v) => { if (v) setApplyMode(v); }}>
                <SelectTrigger className="w-44">
                  <span>{APPLY_MODES.find((m) => m.value === applyMode)?.label ?? applyMode}</span>
                </SelectTrigger>
                <SelectContent>
                  {APPLY_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!result.canApply || applying}
              >
                {applying ? "적용 중..." : "적용"}
              </Button>
              {!result.canApply && (
                <span className="text-xs text-red-600">검증 오류가 있어 적용할 수 없습니다. 원본을 수정 후 다시 업로드하세요.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {applyMessage && (
        <div className="text-sm rounded-lg bg-gray-50 border px-3 py-2">{applyMessage}</div>
      )}

      {/* 적용 이력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">적용 이력</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>적용일시</TableHead>
                <TableHead>파일명</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>행 수</TableHead>
                <TableHead>방식</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>오류</TableHead>
                <TableHead>경고</TableHead>
                <TableHead>되돌리기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-6">
                    적용 이력이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{new Date(h.uploadedAt).toLocaleString("ko-KR")}</TableCell>
                  <TableCell>{h.fileName}</TableCell>
                  <TableCell>{periodLabel(h)}</TableCell>
                  <TableCell>{h.rowCount}</TableCell>
                  <TableCell>{APPLY_MODES.find((m) => m.value === h.applyMode)?.label ?? h.applyMode}</TableCell>
                  <TableCell>{historyStatusBadge(h.status)}</TableCell>
                  <TableCell>{h.errorCount}</TableCell>
                  <TableCell>{h.warningCount}</TableCell>
                  <TableCell>
                    {h.status === "APPLIED" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevert(h.id)}
                        disabled={revertingId === h.id}
                      >
                        {revertingId === h.id ? "되돌리는 중..." : "되돌리기"}
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
