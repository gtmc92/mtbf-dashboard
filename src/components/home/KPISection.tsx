"use client";

export interface KpiData {
  ytdMtbf: number | null;
  ytdMttr: number | null;
  totalIncidents: number;
  totalRepairHours: number;
  preventiveCount: number;
  reactiveCount: number;
  preventiveRatio: number;
  reactiveRatio: number;
  topEquipment: string;
  topEquipmentRatio: number;
  noFailureProcessCount: number;
  totalProcessCount: number;
  noFailureProcessRatio: number;
  noFailureLastMonth: number;
}

interface Props {
  data: KpiData | null;
  loading: boolean;
}

export function KPISection({ data, loading }: Props) {
  const fmtMtbf = (v: number | null | undefined) =>
    v == null ? "-" : v.toLocaleString();

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        KPI 요약 · {new Date().getFullYear()}년 기준
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* 누적 MTBF */}
        <div className="rounded-lg border p-4 bg-blue-50 border-blue-200">
          <p className="text-xs text-gray-500 mb-1">누적 MTBF</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-blue-700">
              {fmtMtbf(data.ytdMtbf)}
              {data.ytdMtbf != null && (
                <span className="text-sm font-normal ml-1">h</span>
              )}
            </p>
          )}
          <p className="text-xs text-blue-400 mt-1">연초~현재 누적 기준</p>
        </div>

        {/* 누적 MTTR */}
        <div className="rounded-lg border p-4 bg-orange-50 border-orange-200">
          <p className="text-xs text-gray-500 mb-1">누적 MTTR</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-orange-700">
              {fmtMtbf(data.ytdMttr)}
              {data.ytdMttr != null && (
                <span className="text-sm font-normal ml-1">h</span>
              )}
            </p>
          )}
          <p className="text-xs text-orange-400 mt-1">연초~현재 누적 기준</p>
        </div>

        {/* 총 수리 건수 */}
        <div className="rounded-lg border p-4 bg-red-50 border-red-200">
          <p className="text-xs text-gray-500 mb-1">총 수리 건수</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-red-700">
              {data.totalIncidents.toLocaleString()}
              <span className="text-sm font-normal ml-1">건</span>
            </p>
          )}
        </div>

        {/* 총 수리시간 */}
        <div className="rounded-lg border p-4 bg-purple-50 border-purple-200">
          <p className="text-xs text-gray-500 mb-1">총 수리시간</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-purple-700">
              {data.totalRepairHours.toLocaleString()}
              <span className="text-sm font-normal ml-1">h</span>
            </p>
          )}
        </div>

        {/* Preventive 비율 */}
        <div className="rounded-lg border p-4 bg-green-50 border-green-200">
          <p className="text-xs text-gray-500 mb-1">Preventive 비율</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-green-700">
              {data.preventiveRatio.toLocaleString()}
              <span className="text-sm font-normal ml-1">%</span>
            </p>
          )}
        </div>

        {/* 무고장 공정 비율 */}
        <div className="rounded-lg border p-4 bg-teal-50 border-teal-200">
          <p className="text-xs text-gray-500 mb-1">무고장 공정 비율</p>
          {loading || !data ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <>
              <p className="text-2xl font-bold text-teal-700">
                {data.noFailureProcessRatio}
                <span className="text-sm font-normal ml-1">%</span>
              </p>
              <p className="text-xs text-teal-500 mt-0.5">
                {new Date().getFullYear()}년 {data.noFailureLastMonth}월 기준
              </p>
              <p className="text-xs text-teal-600 mt-0.5">
                {data.totalProcessCount}개 중 {data.noFailureProcessCount}개 공정 무고장
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
