export interface Factory {
  id: number;
  name: string;
  processes: Process[];
}

export interface Process {
  id: number;
  name: string;
  factoryId: number;
  factory?: Factory;
}

export interface MonthlyRecord {
  id: number;
  year: number;
  month: number;
  processId: number;
  operatingTime: number | null;
  stopCount: number | null;
  stopTime: number | null;
  mtbf: number | null;
  mttr: number | null;
  process?: Process & { factory?: Factory };
}

// 월별 데이터를 공정별로 그룹화한 타입
export interface ProcessSummary {
  processId: number;
  processName: string;
  factoryName: string;
  months: Record<
    number,
    {
      operatingTime: number | null;
      stopCount: number | null;
      stopTime: number | null;
      mtbf: number | null;
      mttr: number | null;
    }
  >;
  totals: {
    operatingTime: number;
    stopCount: number;
    stopTime: number;
    mtbf: number | null;
    mttr: number | null;
  };
}
