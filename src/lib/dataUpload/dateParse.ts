import type { RawCell } from "./types";

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
  quarter: string; // "1Q" ~ "4Q"
}

function quarterOf(month: number): string {
  return `${Math.floor((month - 1) / 3) + 1}Q`;
}

function fromYMD(year: number, month: number, day: number): ParsedDate | null {
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day, quarter: quarterOf(month) };
}

// Excel serial date (1900 date system) → Date. 1899-12-30을 epoch로 두면
// Excel의 1900년 윤년 버그(존재하지 않는 2/29)까지 자연스럽게 보정됨.
function excelSerialToDate(serial: number): Date {
  const ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  return new Date(ms);
}

/** 다양한 형식의 원본 셀 값을 {년,월,일,분기}로 변환. 실패 시 null. */
export function parseDate(raw: RawCell): ParsedDate | null {
  if (raw === null || raw === undefined) return null;

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return fromYMD(raw.getUTCFullYear(), raw.getUTCMonth() + 1, raw.getUTCDate());
  }

  if (typeof raw === "number") {
    if (!isFinite(raw) || raw <= 0) return null;
    const d = excelSerialToDate(raw);
    return fromYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const s = raw.trim();
  if (s === "") return null;

  // Excel serial이 문자열로 들어온 경우 (예: "45678")
  if (/^\d{4,6}$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 80000) {
      const d = excelSerialToDate(n);
      return fromYMD(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
  }

  // YYYY-MM-DD / YYYY.MM.DD
  let m = s.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
  if (m) return fromYMD(Number(m[1]), Number(m[2]), Number(m[3]));

  // YYYY/MM/DD (연도가 4자리인 슬래시 구분)
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return fromYMD(Number(m[1]), Number(m[2]), Number(m[3]));

  // M/D/YYYY (연도가 마지막 4자리 - 미국식)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return fromYMD(Number(m[3]), Number(m[1]), Number(m[2]));

  return null;
}
