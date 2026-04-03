"use client";

import type { KpiData } from "./KPISection";

interface Props {
  data: KpiData | null;
}

interface Alert {
  level: "warning" | "danger";
  message: string;
}

function buildKeyMessage(data: KpiData): string {
  if (data.reactiveRatio >= 60) {
    return "Reactive 중심 운영 → 예방 정비 강화 필요";
  } else if (data.preventiveRatio >= 60) {
    return "Preventive 중심 운영 → 안정적 관리 상태";
  } else {
    return "Reactive → Preventive 전환 진행 중";
  }
}

function buildAlerts(data: KpiData): Alert[] {
  const alerts: Alert[] = [];
  if (data.topEquipmentRatio >= 20) {
    alerts.push({
      level: "warning",
      message: `${data.topEquipment} 설비 사고 집중 (전체의 ${data.topEquipmentRatio}%)`,
    });
  }
  if (data.reactiveRatio >= 30) {
    alerts.push({
      level: "danger",
      message: `Reactive 수리 비율 높음 (${data.reactiveRatio}%)`,
    });
  }
  return alerts;
}

export function AlertSection({ data }: Props) {
  const alerts = data ? buildAlerts(data) : [];

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        운영 알림
      </h2>

      {!data ? null : alerts.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <span>✅</span>
          <span>현재 특이 알림 없음</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm font-medium ${
                alert.level === "danger"
                  ? "border-red-500 bg-red-50 text-red-800"
                  : "border-amber-400 bg-amber-50 text-amber-800"
              }`}
            >
              <span>⚠️</span>
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}
      {data && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          <span>📋</span>
          <span>{buildKeyMessage(data)}</span>
        </div>
      )}
    </div>
  );
}
