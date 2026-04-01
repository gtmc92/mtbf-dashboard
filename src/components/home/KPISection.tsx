"use client";

export interface KpiData {
  avgMtbf: number;
  avgMttr: number;
  totalIncidents: number;
  totalRepairHours: number;
  preventiveCount: number;
  reactiveCount: number;
  preventiveRatio: number;
  reactiveRatio: number;
  topEquipment: string;
  topEquipmentRatio: number;
}

interface Props {
  data: KpiData | null;
  loading: boolean;
}

const KPI_CARDS = [
  {
    key: "avgMtbf" as keyof KpiData,
    label: "평균 MTBF",
    unit: "h",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    key: "avgMttr" as keyof KpiData,
    label: "평균 MTTR",
    unit: "h",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
  {
    key: "totalIncidents" as keyof KpiData,
    label: "총 사고 건수",
    unit: "건",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
  {
    key: "totalRepairHours" as keyof KpiData,
    label: "총 수리시간",
    unit: "h",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    key: "preventiveRatio" as keyof KpiData,
    label: "Preventive 비율",
    unit: "%",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
];

export function KPISection({ data, loading }: Props) {
  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        KPI 요약 · {new Date().getFullYear()}년 기준
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {KPI_CARDS.map((card) => (
          <div
            key={card.key}
            className={`rounded-lg border p-4 ${card.bg}`}
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            {loading || !data ? (
              <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
            ) : (
              <p className={`text-2xl font-bold ${card.color}`}>
                {Number(data[card.key]).toLocaleString()}
                <span className="text-sm font-normal ml-1">{card.unit}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
