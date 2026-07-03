import { resolveHeaders, FIELD_LABELS } from "./columnAliases";
import { parseDate } from "./dateParse";
import { parseTimeToMinutes } from "./timeParse";
import { resolveManagementType } from "./managementType";
import type { ParsedFile, RawCell, RowResult, TransformedRow, TransformResult } from "./types";

function cellToString(raw: RawCell): string | null {
  if (raw === null || raw === undefined) return null;
  if (raw instanceof Date) return null;
  const s = String(raw).trim();
  return s === "" ? null : s;
}

function parseCount(raw: RawCell): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const s = String(raw).trim().replace(/,/g, "");
  if (s === "") return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export function transformRows(
  file: ParsedFile,
  masterMap: Map<string, string>
): TransformResult {
  const { map: headerMap, missing } = resolveHeaders(file.headers);

  if (missing.length > 0) {
    return {
      fileErrors: [
        `필수 컬럼이 없습니다: ${missing.map((f) => FIELD_LABELS[f]).join(", ")}`,
      ],
      headerMap: headerMap as Record<string, number>,
      rows: [],
    };
  }

  const get = (row: RawCell[], field: keyof typeof headerMap): RawCell => {
    const idx = headerMap[field];
    if (idx === undefined) return null;
    return row[idx] ?? null;
  };

  const results: RowResult[] = [];

  file.rows.forEach((row, i) => {
    const rowIndex = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    // 완전 빈 행은 건너뜀
    const isBlank = row.every((c) => c === null || c === undefined || String(c).trim() === "");
    if (isBlank) return;

    const parsedDate = parseDate(get(row, "date"));
    if (!parsedDate) {
      errors.push(`날짜 파싱 실패: "${String(get(row, "date") ?? "")}"`);
    }

    const equipment = cellToString(get(row, "equipment"));
    if (!equipment) {
      errors.push("대표설비 누락");
    }

    const subEquipment = cellToString(get(row, "subEquipment"));
    if (!subEquipment) {
      warnings.push("구성설비 누락");
    }

    const startMin = parseTimeToMinutes(get(row, "startTime"));
    const endMinRaw = parseTimeToMinutes(get(row, "endTime"));
    if (startMin === null) {
      errors.push(`시작 시간 파싱 실패: "${String(get(row, "startTime") ?? "")}"`);
    }
    if (endMinRaw === null) {
      errors.push(`완료 시간 파싱 실패: "${String(get(row, "endTime") ?? "")}"`);
    }

    let durationMin: number | null = null;
    if (startMin !== null && endMinRaw !== null) {
      let end = endMinRaw;
      if (end < startMin) {
        end += 24 * 60;
        warnings.push("자정 넘김 처리됨 (완료시각이 시작시각보다 이른 경우 익일로 계산)");
      }
      durationMin = end - startMin;
      if (durationMin <= 0) {
        warnings.push("시간(분)이 0 이하입니다");
      }
    }

    const technicianCountRaw = parseCount(get(row, "technicianCount"));
    let technicianCount = technicianCountRaw !== null ? Math.round(technicianCountRaw) : null;
    if (technicianCount === null || technicianCount <= 0) {
      technicianCount = 1;
      warnings.push("조치인원 누락 - 기본값 1 적용");
    }

    const repairType = cellToString(get(row, "repairType"));
    if (!repairType) {
      warnings.push("수리유형 없음");
    }
    const { managementType, warning: mgmtWarning } = resolveManagementType(
      repairType,
      masterMap
    );
    if (mgmtWarning) warnings.push(mgmtWarning);

    const repairTime = durationMin !== null ? durationMin * technicianCount : null;

    const data: TransformedRow = {
      year: parsedDate?.year ?? 0,
      month: parsedDate?.month ?? 0,
      day: parsedDate?.day ?? 0,
      quarter: parsedDate?.quarter ?? null,
      equipment: equipment ?? "",
      subEquipment,
      repairItem: cellToString(get(row, "repairItem")),
      incidentType: cellToString(get(row, "incidentType")),
      description: cellToString(get(row, "description")),
      cause: cellToString(get(row, "cause")),
      technician: cellToString(get(row, "technician")),
      technicianCount,
      repairTime,
      repairType,
      count: 1,
      durationMin,
      managementType,
    };

    results.push({ rowIndex, data, errors, warnings });
  });

  // 중복 가능 행 검사 (같은 배치 내 날짜+대표설비+구성설비+시작+완료+조치자 키 중복)
  const keyCount = new Map<string, number[]>();
  results.forEach((r) => {
    if (!r.data) return;
    const row = file.rows[r.rowIndex - 1];
    const key = [
      r.data.year,
      r.data.month,
      r.data.day,
      r.data.equipment,
      r.data.subEquipment,
      String(get(row, "startTime") ?? ""),
      String(get(row, "endTime") ?? ""),
      r.data.technician,
    ].join("::");
    const arr = keyCount.get(key) ?? [];
    arr.push(r.rowIndex);
    keyCount.set(key, arr);
  });
  for (const rowIndexes of keyCount.values()) {
    if (rowIndexes.length <= 1) continue;
    for (const idx of rowIndexes) {
      const r = results.find((x) => x.rowIndex === idx);
      const others = rowIndexes.filter((n) => n !== idx);
      r?.warnings.push(`중복 가능 행 (${others.map((n) => `${n}행`).join(", ")}과 동일 패턴)`);
    }
  }

  return { fileErrors: [], headerMap: headerMap as Record<string, number>, rows: results };
}
