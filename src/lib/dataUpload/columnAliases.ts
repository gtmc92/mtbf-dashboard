// 원본 일일작업일보 컬럼 별칭 매핑 - Power Query가 하던 컬럼 정규화 역할

export type CanonicalField =
  | "date"
  | "equipment"
  | "subEquipment"
  | "repairType"
  | "incidentType"
  | "description"
  | "cause"
  | "technician"
  | "technicianCount"
  | "startTime"
  | "endTime"
  | "repairItem";

export const COLUMN_ALIASES: Record<CanonicalField, string[]> = {
  date: ["수리일", "일자", "작업일", "Date", "date"],
  equipment: ["대표설비", "설비", "Equipment"],
  subEquipment: ["구성설비", "설비구성"],
  repairType: ["수리유형", "유형"],
  incidentType: ["사고분류", "분류"],
  description: ["사고 처리 내용", "수리내용", "조치내용", "처리내용"],
  cause: ["원인"],
  technician: ["조치자", "담당자"],
  technicianCount: ["조치인원", "인원"],
  startTime: ["수리시작시분", "시작", "시작시간"],
  endTime: ["수리완료시분", "완료", "종료", "마감", "완료시간"],
  repairItem: ["수리항목", "수리항목 재분류", "사유"],
};

// 파일 레벨에서 반드시 있어야 하는 컬럼 (없으면 업로드 자체를 거부)
export const REQUIRED_FIELDS: CanonicalField[] = [
  "date",
  "equipment",
  "repairType",
  "startTime",
  "endTime",
];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** 원본 헤더 배열을 정식 필드명 → 컬럼 인덱스 맵으로 변환 */
export function resolveHeaders(headers: string[]): {
  map: Partial<Record<CanonicalField, number>>;
  missing: CanonicalField[];
} {
  const normalizedHeaders = headers.map(normalizeHeader);
  const map: Partial<Record<CanonicalField, number>> = {};

  (Object.keys(COLUMN_ALIASES) as CanonicalField[]).forEach((field) => {
    const aliases = COLUMN_ALIASES[field].map(normalizeHeader);
    const idx = normalizedHeaders.findIndex((h) => aliases.includes(h));
    if (idx !== -1) map[field] = idx;
  });

  const missing = REQUIRED_FIELDS.filter((f) => map[f] === undefined);
  return { map, missing };
}

export const FIELD_LABELS: Record<CanonicalField, string> = {
  date: "수리일",
  equipment: "대표설비",
  subEquipment: "구성설비",
  repairType: "수리유형",
  incidentType: "사고분류",
  description: "사고 처리 내용",
  cause: "원인",
  technician: "조치자",
  technicianCount: "조치인원",
  startTime: "수리시작시분",
  endTime: "수리완료시분",
  repairItem: "수리항목",
};
