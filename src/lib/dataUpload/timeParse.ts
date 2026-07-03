import type { RawCell } from "./types";

function clampMinutes(h: number, m: number): number | null {
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function to24Hour(hour12: number, isPM: boolean): number | null {
  if (hour12 < 1 || hour12 > 12) return null;
  if (isPM) return hour12 === 12 ? 12 : hour12 + 12;
  return hour12 === 12 ? 0 : hour12;
}

/** 다양한 형식의 시간 값을 자정(00:00) 기준 분(0~1439)으로 변환. 실패 시 null. */
export function parseTimeToMinutes(raw: RawCell): number | null {
  if (raw === null || raw === undefined) return null;

  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return null;
    return clampMinutes(raw.getUTCHours(), raw.getUTCMinutes());
  }

  if (typeof raw === "number") {
    if (!isFinite(raw) || raw < 0) return null;
    // Excel time은 하루를 0~1 소수로 표현. 날짜+시간 결합 값은 소수부만 사용.
    const frac = raw - Math.floor(raw);
    const totalMinutes = Math.round(frac * 24 * 60);
    return clampMinutes(Math.floor(totalMinutes / 60), totalMinutes % 60);
  }

  const s = raw.trim();
  if (s === "") return null;

  // 오전/오후 h:mm (공백 유무 모두 허용)
  let m = s.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (m) {
    const h24 = to24Hour(Number(m[2]), m[1] === "오후");
    if (h24 === null) return null;
    return clampMinutes(h24, Number(m[3]));
  }

  // h:mm AM/PM
  m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (m) {
    const h24 = to24Hour(Number(m[1]), m[3].toUpperCase() === "PM");
    if (h24 === null) return null;
    return clampMinutes(h24, Number(m[2]));
  }

  // HH:mm / H:mm (24시간제)
  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return clampMinutes(Number(m[1]), Number(m[2]));

  return null;
}
