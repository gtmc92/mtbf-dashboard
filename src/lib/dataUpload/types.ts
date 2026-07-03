// 원본 업로드 → DATA_BASE 변환 파이프라인 공용 타입

export type RawCell = string | number | Date | null;

export interface ParsedFile {
  headers: string[];
  rows: RawCell[][];
}

// RepairTypeRecord 생성 페이로드 (id/no/uploadBatchId 제외 - 적용 시점에 부여)
export interface TransformedRow {
  year: number;
  month: number;
  day: number;
  equipment: string;
  subEquipment: string | null;
  repairItem: string | null;
  incidentType: string | null;
  description: string | null;
  cause: string | null;
  technician: string | null;
  technicianCount: number | null;
  repairTime: number | null;
  repairType: string | null;
  count: number | null;
  durationMin: number | null;
  managementType: string | null;
  quarter: string | null;
}

export interface RowResult {
  rowIndex: number; // 원본 파일 기준 데이터 행 번호 (헤더 제외, 1부터)
  data: TransformedRow | null; // 치명적 에러로 변환 불가 시 null
  errors: string[];
  warnings: string[];
}

export interface TransformResult {
  fileErrors: string[]; // 필수 컬럼 누락 등 파일 레벨 에러 (있으면 rows는 비어있음)
  headerMap: Record<string, number>;
  rows: RowResult[];
}
